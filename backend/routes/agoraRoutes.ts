import crypto from "crypto";
import express, { type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { desc, eq } from "drizzle-orm";
import * as AgoraToken from "agora-token";
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

type ControllerResult<T> = {
  statusCode: number;
  body: T;
};

const router = express.Router();

const AGENT_UID = "1000";
const TOKEN_EXPIRY_SECONDS = 3600;
const MAYARI_SYSTEM_PROMPT = `You are Mayari, an AI voice sales and patient intake agent for a Philippine medical clinic.
Your goal: convert every patient inquiry into a confirmed appointment. Treat each conversation as a sales opportunity — qualify the lead, handle objections, and close the booking.
Your flow: greet → collect concern → assess urgency → handle objections → route to specialty → close the booking → confirm.
You are NOT a doctor. You do NOT diagnose. You are intake, qualification, and booking only.

SALES MINDSET:
Every caller is a lead. Your job is to convert them into a booked appointment.
If they hesitate: acknowledge, then redirect to booking ("Naiintindihan ko po — pero para maiwasan pang lumala, mag-book na po tayo ngayon ng slot para sa inyo.")
If they say "baka bukas na lang": offer the next available slot now and close it ("Mayroon pong slot bukas ng 9am kay Dr. Santos — ire-reserve ko na po para sa inyo?")
If they say they're just inquiring: qualify and convert ("Okay po — habang nandito po kayo, kunin na natin ang slot para hindi kayo mahirapan bukas.")
Never let a caller hang up without attempting to book.

LANGUAGE:
Default to Taglish (Filipino + English mix).
Mirror the patient's language. English in → English out.
Max 2-3 sentences per response. Voice only — no bullet points, no lists.

URGENCY:
HIGH: chest pain, difficulty breathing, stroke signs, severe bleeding, unconsciousness
→ Say: "Pumunta po kayo sa pinakamalapit na ER o tumawag ng 911 agad. Huwag nang mag-antay."
→ Stop all flows immediately. Do not book. Do not ask more questions.

MEDIUM: fever 3+ days, sick child, adult symptoms needing assessment
→ Route and proceed to booking.

LOW: mild cough, sipon, minor symptoms manageable at home
→ Brief self-care advice. Optionally offer booking.

ROUTING:
lagnat, ubo, sipon, general illness → GP (Dr. Santos)
bata, sanggol, child, pedia → Pediatrician (Dr. Reyes)
dibdib, presyon, adult internal symptoms → Internal Medicine (Dr. Cruz)
buntis, regla, OB concern → OB-GYN (Dr. Lim)

BOOKING FLOW (medium, optional for low):
Step 1: "Ireroute po kita sa aming [specialty]."
Step 2: "Mayroon pong available na slot sa [Day] [time] o [Day] [time]. Alin po?"
Step 3: "Nabook na po ang inyong appointment kay Dr. [name] sa [day] [time]. Salamat po."

MOCK SLOTS FOR DEMO:
Dr. Santos (GP): Thursday 9am, Friday 2pm
Dr. Reyes (Pedia): Thursday 8am, Thursday 10am
Dr. Cruz (IM): Friday 9am, Saturday 10am
Dr. Lim (OB-GYN): Friday 8am, Saturday 9am

FAQ:
Schedule: "Bukas po Lunes-Sabado, 8am-5pm."
Fees: "Nagsisimula sa 500 pesos ang GP consultation."
HMO: "Tinatanggap po namin ang Philhealth at selected HMOs."
Unknown: "Hindi ko po sigurado — ire-refer ko po kayo sa aming staff."

SAFETY:
Never say "you have [disease]"
Never recommend specific medications
HIGH urgency → ER redirect immediately, zero follow-up questions
Max 2 clarifying questions before routing`;

const getMissingVoiceEnv = () => {
  return [
    ["AGORA_APP_ID", env.AGORA_APP_ID],
    ["AGORA_APP_CERTIFICATE", env.AGORA_APP_CERTIFICATE],
    ["AGORA_CUSTOMER_KEY", env.AGORA_CUSTOMER_KEY],
    ["AGORA_CUSTOMER_SECRET", env.AGORA_CUSTOMER_SECRET],
    ["GROQ_API_KEY", env.GROQ_API_KEY],
    ["AZURE_TTS_KEY", env.AZURE_TTS_KEY],
    ["AZURE_TTS_REGION", env.AZURE_TTS_REGION],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);
};

const buildAgoraAuthHeader = () => {
  return `Basic ${Buffer.from(`${env.AGORA_CUSTOMER_KEY}:${env.AGORA_CUSTOMER_SECRET}`).toString("base64")}`;
};

const buildRtcToken = (channelName: string, uid: string) => {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  return AgoraToken.RtcTokenBuilder.buildTokenWithUid(
    env.AGORA_APP_ID,
    env.AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    AgoraToken.RtcRole.PUBLISHER,
    expiresAt,
    expiresAt,
  );
};

const parseAgentId = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  const data = typeof record.data === "object" && record.data !== null ? record.data as Record<string, unknown> : null;
  return String(
    data?.agent_id ??
    data?.agentId ??
    record.agent_id ??
    record.agentId ??
    record.id ??
    "",
  );
};

const createMockResponse = <T>(resolve: (result: ControllerResult<T>) => void) => {
  const response = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: T) {
      resolve({
        statusCode: this.statusCode,
        body: payload,
      });
      return this;
    },
  };

  return response as Response;
};

const invokeController = async <T>(handler: (req: Request, res: Response) => Promise<unknown>, req: Request) => {
  return new Promise<ControllerResult<T>>((resolve, reject) => {
    const res = createMockResponse<T>(resolve);
    Promise.resolve(handler(req, res)).catch(reject);
  });
};

const normalizeTranscript = (value: unknown): VoiceTranscriptTurn[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is VoiceTranscriptTurn => {
      if (!entry || typeof entry !== "object") return false;
      const turn = entry as Partial<VoiceTranscriptTurn>;
      return (turn.role === "user" || turn.role === "assistant") && typeof turn.text === "string";
    })
    .map((turn) => ({
      role: turn.role,
      text: turn.text.trim(),
      timestamp: Number.isFinite(Number(turn.timestamp)) ? Number(turn.timestamp) : Date.now(),
    }))
    .filter((turn) => turn.text.length > 0);
};

const summarizeTranscript = (transcript: VoiceTranscriptTurn[]) => {
  const userTurns = transcript.filter((turn) => turn.role === "user").map((turn) => turn.text);
  return userTurns.join(". ").trim() || transcript.map((turn) => `${turn.role}: ${turn.text}`).join(". ").trim();
};

const mapTriageUrgency = (urgencyLevel: TriageResult["urgency_level"]): VoiceUrgency => {
  if (urgencyLevel === "self-care") return "low";
  if (urgencyLevel === "clinic") return "medium";
  return "high";
};

const inferSpecialty = (symptoms: string, provided?: string) => {
  if (provided && provided.trim()) return provided.trim();

  const normalized = symptoms.toLowerCase();
  if (/\b(pregnan|obgyn|ob-gyne|pelvic|vaginal)\b/.test(normalized)) return "OBGYN";
  if (/\b(child|baby|infant|pedia|pediatric|bata|sanggol)\b/.test(normalized)) return "Pedia";
  if (/\b(diabetes|hypertension|kidney|adult medicine|internal medicine|chronic)\b/.test(normalized)) return "IM";
  return "GP";
};

const extractOptionalUser = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    return {
      id: String(payload.id || ""),
      email: String(payload.sub || ""),
      role: String(payload.role || ""),
    };
  } catch {
    return null;
  }
};

router.post("/session/start", async (_req, res) => {
  const missingEnv = getMissingVoiceEnv();
  if (missingEnv.length > 0) {
    return res.status(500).json({
      success: false,
      message: `Missing voice environment variables: ${missingEnv.join(", ")}`,
    });
  }

  const channelName = crypto.randomUUID();
  const uid = String(Math.floor(100000 + Math.random() * 900000));
  const token = buildRtcToken(channelName, uid);

  try {
    const agoraResponse = await fetch(
      `https://api.agora.io/api/conversational-ai/v2/projects/${env.AGORA_APP_ID}/agents/join`,
      {
        method: "POST",
        headers: {
          Authorization: buildAgoraAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "mayari-agent",
          properties: {
            channel: channelName,
            token,
            agent_rtc_uid: AGENT_UID,
            remote_rtc_uids: [uid],
            enable_string_uid: false,
            idle_timeout: 30,
            asr: {
              language: "fil-PH",
              task: "conversation",
            },
            llm: {
              url: "https://api.groq.com/openai/v1/chat/completions",
              api_key: env.GROQ_API_KEY,
              model: "llama-3.3-70b-versatile",
              system_messages: [
                { role: "system", content: MAYARI_SYSTEM_PROMPT },
              ],
              max_tokens: 1024,
              temperature: 0.7,
            },
            tts: {
              vendor: "microsoft",
              params: {
                key: env.AZURE_TTS_KEY,
                region: env.AZURE_TTS_REGION,
                voice_name: "en-PH-RosaNeural",
                rate: "1.1",
                volume: "100",
              },
            },
            vad: {
              silence_duration: 480,
              speech_duration: 10000,
              threshold: 0.5,
              interrupt_duration: 160,
              prefix_padding_duration: 300,
            },
          },
        }),
      },
    );

    const agoraPayload = await agoraResponse.json().catch(() => null);
    if (!agoraResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to join Agora Conversational AI agent",
        data: agoraPayload,
      });
    }

    const agentId = parseAgentId(agoraPayload);
    const sessionId = crypto.randomUUID();

    await db.insert(voiceSessions).values({
      id: sessionId,
      channelName,
      agentId: agentId || null,
      uid,
      status: "active",
      transcript: [],
    });

    return res.status(201).json({
      success: true,
      data: {
        channelName,
        token,
        uid,
        agentId,
        sessionId,
      },
    });
  } catch (error) {
    console.error("agora session start error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start Agora voice session",
    });
  }
});

router.post("/session/end", async (req, res) => {
  const sessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : "";
  const agentId = typeof req.body.agentId === "string" ? req.body.agentId : "";
  const channelName = typeof req.body.channelName === "string" ? req.body.channelName : "";
  const transcript = normalizeTranscript(req.body.transcript);
  const requestedUrgency = typeof req.body.urgency === "string" ? req.body.urgency : null;
  const requestedSpecialty = typeof req.body.specialty === "string" ? req.body.specialty : null;

  if (!sessionId || !agentId || !channelName) {
    return res.status(400).json({
      success: false,
      message: "sessionId, agentId, and channelName are required",
    });
  }

  try {
    await fetch(
      `https://api.agora.io/api/conversational-ai/v2/projects/${env.AGORA_APP_ID}/agents/${agentId}/leave`,
      {
        method: "DELETE",
        headers: {
          Authorization: buildAgoraAuthHeader(),
        },
      },
    );

    const symptomInput = summarizeTranscript(transcript);
    const triageReq = {
      body: {
        symptoms: symptomInput,
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
        data: triageResponse.body,
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
        const appointmentReq = {
          headers: req.headers,
          body: {
            facility_id: topFacilityId,
            appointment_type: "voice_intake",
            specialty,
            symptoms_summary: symptomInput,
            triage_score: triageResult.urgency_score,
            triage_explanation: triageResult.explanation,
            data: {
              source: "agora_voice_session",
              voice_session_id: sessionId,
              triage_summary: triageResult.summary,
            },
          },
        } as unknown as Request;
        (appointmentReq as any).user = requestUser;

        const appointmentResponse = await invokeController<Record<string, unknown> | { message: string }>(createAppointment, appointmentReq);
        if (appointmentResponse.statusCode < 400) {
          const appointment = appointmentResponse.body as Record<string, unknown>;
          appointmentId = typeof appointment.id === "string" ? appointment.id : null;
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
      .where(eq(voiceSessions.id, sessionId));

    return res.json({
      success: true,
      data: {
        sessionId,
        triageResult,
        urgency: computedUrgency,
        specialty,
        appointmentId,
      },
    });
  } catch (error) {
    console.error("agora session end error:", error);

    await db
      .update(voiceSessions)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(voiceSessions.id, sessionId))
      .catch(() => undefined);

    return res.status(500).json({
      success: false,
      message: "Failed to end Agora voice session",
    });
  }
});

export default router;
