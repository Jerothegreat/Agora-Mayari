import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import express from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AccessToken } from "livekit-server-sdk";
import { db } from "../configs/db.js";
import { env } from "../configs/envalid.js";
import { createAppointment } from "../controllers/appointmentControllers.js";
import { getTriage, triageSessions } from "../controllers/triageController.js";
import { voiceSessions, type VoiceTranscriptTurn } from "../models/voiceSessionModel.js";

type VoiceUrgency = "low" | "medium" | "high";
type TriageResult = {
  urgency_level: "self-care" | "clinic" | "er" | "emergency";
  urgency_score: number;
  summary: string;
  explanation: string;
  recommended_facility_type?: string;
  facility_recommendations?: Array<{ id: string }>;
};
type ControllerResult<T> = { statusCode: number; body: T };

const router = express.Router();

const createMockResponse = <T>(resolve: (result: ControllerResult<T>) => void) => {
  const response = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: T) { resolve({ statusCode: this.statusCode, body: payload }); return this; },
  };
  return response as Response;
};

const invokeController = async <T>(
  handler: (req: Request, res: Response) => Promise<unknown>,
  req: Request,
) =>
  new Promise<ControllerResult<T>>((resolve, reject) => {
    const res = createMockResponse<T>(resolve);
    Promise.resolve(handler(req, res)).catch(reject);
  });

const normalizeTranscript = (value: unknown): VoiceTranscriptTurn[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e): e is VoiceTranscriptTurn => {
      if (!e || typeof e !== "object") return false;
      const t = e as Partial<VoiceTranscriptTurn>;
      return (t.role === "user" || t.role === "assistant") && typeof t.text === "string";
    })
    .map((t) => ({
      role: t.role,
      text: t.text.trim(),
      timestamp: Number.isFinite(Number(t.timestamp)) ? Number(t.timestamp) : Date.now(),
    }))
    .filter((t) => t.text.length > 0);
};

const summarizeTranscript = (transcript: VoiceTranscriptTurn[]) => {
  const user = transcript.filter((t) => t.role === "user").map((t) => t.text);
  return user.join(". ").trim() || transcript.map((t) => `${t.role}: ${t.text}`).join(". ").trim();
};

const mapTriageUrgency = (level: TriageResult["urgency_level"]): VoiceUrgency => {
  if (level === "self-care") return "low";
  if (level === "clinic") return "medium";
  return "high";
};

const inferSpecialty = (symptoms: string, provided?: string) => {
  if (provided?.trim()) return provided.trim();
  const s = symptoms.toLowerCase();
  if (/\b(pregnan|obgyn|ob-gyne|pelvic|vaginal)\b/.test(s)) return "OBGYN";
  if (/\b(child|baby|infant|pedia|pediatric|bata|sanggol)\b/.test(s)) return "Pedia";
  if (/\b(diabetes|hypertension|kidney|internal medicine|chronic)\b/.test(s)) return "IM";
  return "GP";
};

const extractOptionalUser = (req: Request) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.slice(7), env.ACCESS_TOKEN_SECRET) as JwtPayload;
    return { id: String(payload.id || ""), email: String(payload.sub || ""), role: String(payload.role || "") };
  } catch {
    return null;
  }
};

// POST /api/livekit/token — generate a room token for the browser to join
router.post("/token", async (_req, res) => {
  if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET || !env.LIVEKIT_URL) {
    return res.status(500).json({
      success: false,
      message: "LiveKit credentials not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env",
    });
  }

  const roomName = `mayari-${crypto.randomUUID()}`;
  const identity = `patient-${Date.now()}`;
  const sessionId = crypto.randomUUID();

  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    ttl: "1h",
  });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();

  try {
    await db.insert(voiceSessions).values({
      id: sessionId,
      channelName: roomName,
      agentId: null,
      uid: identity,
      status: "active",
      transcript: [],
    });
  } catch (err) {
    console.error("voice session DB insert error:", err);
    // Non-fatal — continue even if DB write fails
  }

  return res.status(201).json({
    success: true,
    data: {
      token,
      roomName,
      sessionId,
      url: env.LIVEKIT_URL,
    },
  });
});

// POST /api/livekit/session/end — run triage on transcript, book if needed
router.post("/session/end", async (req, res) => {
  const sessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : "";
  const roomName = typeof req.body.roomName === "string" ? req.body.roomName : "";
  const transcript = normalizeTranscript(req.body.transcript);
  const requestedUrgency = typeof req.body.urgency === "string" ? req.body.urgency : null;
  const requestedSpecialty = typeof req.body.specialty === "string" ? req.body.specialty : null;

  const symptomInput = summarizeTranscript(transcript);

  try {
    const triageReq = {
      body: {
        symptoms: symptomInput || "Voice intake — no speech captured",
        session_token: sessionId,
        language: "Filipino",
        region: "Metro Manila",
      },
    } as Request;

    const triageResponse = await invokeController<TriageResult | { message: string }>(getTriage, triageReq);
    if (triageResponse.statusCode >= 400) {
      return res.status(triageResponse.statusCode).json({
        success: false,
        message: "Failed to generate triage result from transcript",
      });
    }

    const triageResult = triageResponse.body as TriageResult;
    const computedUrgency = requestedUrgency && ["low", "medium", "high"].includes(requestedUrgency)
      ? requestedUrgency as VoiceUrgency
      : mapTriageUrgency(triageResult.urgency_level);
    const specialty = inferSpecialty(symptomInput, requestedSpecialty || undefined);

    const triageRecord = await db
      .select({ id: triageSessions.id })
      .from(triageSessions)
      .where(eq(triageSessions.session_token, sessionId))
      .orderBy(desc(triageSessions.created_at))
      .limit(1);

    const requestUser = extractOptionalUser(req);
    let appointmentId: string | null = null;

    if ((computedUrgency === "low" || computedUrgency === "medium") && requestUser) {
      const topFacilityId = triageResult.facility_recommendations?.[0]?.id || "";
      if (topFacilityId) {
        const apptReq = {
          headers: req.headers,
          body: {
            facility_id: topFacilityId,
            appointment_type: "voice_intake",
            specialty,
            symptoms_summary: symptomInput,
            triage_score: triageResult.urgency_score,
            triage_explanation: triageResult.explanation,
            data: { source: "livekit_voice_session", voice_session_id: sessionId },
          },
        } as unknown as Request;
        (apptReq as any).user = requestUser;

        const apptResponse = await invokeController<Record<string, unknown> | { message: string }>(
          createAppointment,
          apptReq,
        );
        if (apptResponse.statusCode < 400) {
          const appt = apptResponse.body as Record<string, unknown>;
          appointmentId = typeof appt.id === "string" ? appt.id : null;
        }
      }
    }

    await db
      .update(voiceSessions)
      .set({
        status: "completed",
        urgency: computedUrgency,
        specialty,
        triageId: triageRecord[0]?.id || null,
        appointmentId,
        transcript,
        updatedAt: new Date(),
      })
      .where(eq(voiceSessions.id, sessionId))
      .catch(() => undefined);

    return res.json({
      success: true,
      data: { sessionId, triageResult, urgency: computedUrgency, specialty, appointmentId },
    });
  } catch (error) {
    console.error("livekit session end error:", error);
    return res.status(500).json({ success: false, message: "Failed to end voice session" });
  }
});

export default router;
