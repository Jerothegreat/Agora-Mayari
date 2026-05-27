import type { Request, Response } from "express";
import { Groq } from "groq-sdk";
import crypto from "crypto";
import { env } from "../configs/envalid.js";
import { tryCatch } from "../utils/tryCatch.js";
import { db, pool } from "../configs/db.js";
import { pgTable, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { and, eq, desc } from "drizzle-orm";
import { facilities } from "../models/facilityModel.js";
import {
  buildEvidenceLedger,
  buildFacilityRecommendations,
  buildSafetyRules,
  getMinimumScoreFromRules,
  urgencyLevelFromScore,
} from "../services/trustEngine.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const urgencyClassification = (score: number) => {
  if (score >= 9) return "Emergency Care Now";
  if (score >= 7) return "Urgent Care Within 2-4 Hours";
  if (score >= 4) return "Clinical Visit Within 24-48 Hours";
  return "Self-Care With Safety Monitoring";
};

// Temporary model definition for TriageSession until we consolidate models
export const triageSessions = pgTable("triage_sessions", {
  id: varchar("id").primaryKey().notNull(),
  session_token: varchar("session_token"),
  symptoms_raw: text("symptoms_raw"),
  age: integer("age"),
  sex: varchar("sex"),
  urgency_level: varchar("urgency_level"),
  urgency_score: integer("urgency_score"),
  region: varchar("region"),
  created_at: timestamp("created_at").defaultNow(),
  language: varchar("language").default("English"),
});

export const getTriage = async (req: Request, res: Response) => {
  const { symptoms, language, session_token, region } = req.body;
  const symptomsText = typeof symptoms === "string" ? symptoms.trim() : "";
  if (!symptomsText) {
    return res.status(400).json({ message: "Symptoms are required" });
  }

  const ageRaw = req.body.age;
  const ageNumber = ageRaw !== undefined ? Number(ageRaw) : undefined;
  if (ageNumber !== undefined) {
    if (!Number.isFinite(ageNumber) || !Number.isInteger(ageNumber) || ageNumber < 0 || ageNumber > 120) {
      return res.status(400).json({ message: "Age must be a whole number between 0 and 120." });
    }
  }

  const durationText = typeof req.body.duration === "string" ? req.body.duration.trim() : undefined;
  const sexText = typeof req.body.sex === "string" ? req.body.sex.trim() : undefined;
  const conditionsList = Array.isArray(req.body.conditions)
    ? req.body.conditions.filter((c: unknown) => typeof c === "string" && c.trim().length > 0)
    : [];

  // Fetch Longitudinal History (Last 5 sessions in the last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const historyResult = await tryCatch(
    db.select({
      symptoms: triageSessions.symptoms_raw,
      urgency: triageSessions.urgency_score,
      date: triageSessions.created_at
    })
    .from(triageSessions)
    .where(eq(triageSessions.session_token, session_token || 'anonymous'))
    .orderBy(desc(triageSessions.created_at))
    .limit(5)
  );

  const historyContext = (historyResult.data || []).map(h => 
    `- [${h.date?.toLocaleDateString()}]: ${h.symptoms} (Urgency: ${h.urgency}/10)`
  ).join('\n');

  const patientContext = [
    ageNumber !== undefined ? `Age: ${ageNumber}` : null,
    sexText ? `Sex: ${sexText}` : null,
    durationText ? `Duration: ${durationText}` : null,
    conditionsList.length ? `Pre-existing Conditions: ${conditionsList.join(', ')}` : null,
  ].filter(Boolean).join(' | ');

  const prompt = `You are Haliya, a safety-layered AI medical triage assistant for the Philippines. You provide decision support, not diagnosis, and your output will be checked by deterministic safety rules before it is shown to patients or facilities. You combine emergency medicine triage principles with epidemiological awareness.

=== PATIENT PROFILE ===
${patientContext || 'No demographic data provided.'}

=== PRESENTING SYMPTOMS ===
${symptomsText}

=== LONGITUDINAL PATIENT HISTORY (Last 7 days) ===
${historyContext || 'No previous reports on file — this is a first-time assessment.'}

=== CLINICAL INTELLIGENCE DIRECTIVES ===

1. DIFFERENTIAL DIAGNOSIS: Provide exactly 3 possible conditions ranked by clinical likelihood. For each, explain the specific symptom-to-condition mapping. Consider tropical diseases endemic to the Philippines (Dengue, Leptospirosis, TB, Typhoid) when symptoms match.

2. RED FLAGS: Identify specific warning signs that would require IMMEDIATE escalation. These should be concrete, actionable symptoms the patient should monitor (e.g., "blood in stool", "difficulty breathing at rest", "sudden vision loss"). Do NOT list generic advice.

3. URGENCY SCORING (be precise):
   - 9-10: LIFE-THREATENING — Call 911 / Rush to nearest ER. Examples: chest pain with radiation, signs of stroke, severe hemorrhage, anaphylaxis, suspected internal bleeding.
   - 7-8: URGENT — Seek medical attention within 2-4 hours. Examples: high-grade fever (>39°C) with rash, severe abdominal pain, head injury with confusion.
   - 4-6: NON-URGENT — Schedule clinical visit within 24-48 hours. Examples: persistent mild symptoms, minor infections, non-severe pain.
   - 1-3: SELF-CARE — Manageable at home with OTC medication and rest.

4. CONSERVATIVE SAFETY: Avoid over-triage. Use calm, non-alarmist language and do NOT say "requires immediate medical attention" unless urgency_score is 9-10 AND red flags are present. If key details are missing or symptoms are vague, lean toward a lower urgency with clear safety-net advice.

5. CRITICAL OVERRIDE: If symptoms include "internal bleeding", "chest pain radiating to arm/jaw", "sudden worst headache of life", "stroke symptoms (FAST)", or "difficulty breathing" → urgency_score MUST be 9 or 10.

6. LONGITUDINAL PATTERN DETECTION: If the SAME or similar symptoms appear 2+ times in the patient history within 7 days:
   - UPGRADE urgency_score by 2-3 points minimum
   - Set pattern_detected to true
   - Explain why persistence changes the clinical picture (e.g., "Recurring headaches over 5 days without improvement raises concern for intracranial pathology and warrants neurological workup")

7. FACILITY RECOMMENDATION: Based on urgency, recommend the appropriate Philippine healthcare facility type:
   - Score 1-3: "Barangay Health Station (BHS) or home care"
   - Score 4-6: "Primary Care Clinic or Rural Health Unit (RHU)"
   - Score 7-8: "Hospital Emergency Department or Urgent Care Center"
   - Score 9-10: "NEAREST EMERGENCY ROOM — Call 911 immediately"

8. CONFIDENCE LEVEL: Rate your diagnostic confidence from 0.0 to 1.0. Lower confidence when symptoms are vague, contradictory, or when critical information (age, duration) is missing.

9. LANGUAGE: Respond in ${language || 'English'}. If Filipino, use natural conversational Tagalog for the explanation and next_steps, but keep medical terms in English.

=== RESPONSE FORMAT (strict JSON) ===
{
  "urgency_level": "self-care" | "clinic" | "er" | "emergency",
  "urgency_score": <integer 1-10>,
  "classification": "<human-readable label, e.g. 'Consult a Doctor Within 24 Hours'>",
  "summary": "<one-line clinical summary of the presenting complaint>",
  "differential_diagnosis": [
    { "condition": "<name>", "likelihood": "High" | "Moderate" | "Low", "reasoning": "<2-3 sentence clinical reasoning linking symptoms to this condition>" },
    { "condition": "<name>", "likelihood": "High" | "Moderate" | "Low", "reasoning": "<reasoning>" },
    { "condition": "<name>", "likelihood": "High" | "Moderate" | "Low", "reasoning": "<reasoning>" }
  ],
  "red_flags": ["<specific dangerous symptom to watch for>", "<another>"],
  "recommended_facility_type": "<facility recommendation string>",
  "next_steps": ["<specific actionable step>", "<another>", "<another>"],
  "explanation": "<3-5 sentence clinical reasoning paragraph explaining the overall assessment, connecting symptoms to urgency level, and justifying the score>",
  "confidence_level": <float 0.0-1.0>,
  "pattern_detected": <boolean>,
  "pattern_description": "<description if pattern detected, null otherwise>"
}`;

  const completion = await tryCatch(
    groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: env.GROQ_MODEL,
      response_format: { type: "json_object" },
    })
  );

  if (completion.error || !completion.data) {
    return res.status(500).json({ message: "AI Assessment failed", error: completion.error });
  }

  let result: Record<string, any>;
  try {
    result = JSON.parse(completion.data!.choices[0]!.message.content || "{}");
  } catch {
    return res.status(502).json({ message: "AI Assessment returned invalid JSON" });
  }

  const safetyInput = {
    symptoms: symptomsText,
    conditions: conditionsList,
    ...(ageNumber !== undefined ? { age: ageNumber } : {}),
    ...(durationText ? { duration: durationText } : {}),
  };
  const safetyRules = buildSafetyRules(safetyInput);
  const minimumRuleScore = getMinimumScoreFromRules(safetyRules);
  const aiScore = Number(result.urgency_score || 1);
  const adjustedScore = minimumRuleScore !== null ? Math.max(aiScore, minimumRuleScore) : aiScore;
  const safetyOverrideApplied = adjustedScore !== aiScore;

  result.urgency_score = Math.min(10, Math.max(1, Math.round(adjustedScore)));
  result.urgency_level = urgencyLevelFromScore(result.urgency_score);
  result.classification = safetyOverrideApplied ? urgencyClassification(result.urgency_score) : result.classification || urgencyClassification(result.urgency_score);
  result.summary = typeof result.summary === "string" && result.summary.trim() ? result.summary : symptomsText.slice(0, 180);
  result.explanation = typeof result.explanation === "string" ? result.explanation : "Haliya generated this triage result from the provided symptoms and safety rules.";
  result.next_steps = Array.isArray(result.next_steps) ? result.next_steps : [];

  if (safetyOverrideApplied) {
    const overrideReason = safetyRules
      .filter((rule) => rule.severity === "emergency" || rule.severity === "urgent")
      .map((rule) => rule.label)
      .join(", ");
    result.explanation = `${result.explanation} Safety override applied: ${overrideReason || "high-risk rule triggered"}, so the urgency score was raised from ${aiScore}/10 to ${result.urgency_score}/10.`;
    result.next_steps = [
      result.urgency_level === "emergency" ? "Call 911 or go to the nearest emergency room now." : "Seek urgent clinical care as soon as possible.",
      ...result.next_steps,
    ].slice(0, 4);
  }

  const auditId = crypto.randomUUID();
  result.evidence_ledger = buildEvidenceLedger({
    ...safetyInput,
    auditId,
    model: env.GROQ_MODEL,
    aiScore: result.urgency_score,
    aiUrgencyLevel: String(result.urgency_level),
    confidence: typeof result.confidence_level === "number" ? result.confidence_level : undefined,
  });

  const [facilityResult, queueResult] = await Promise.all([
    tryCatch(
      db
        .select()
        .from(facilities)
        .where(and(eq(facilities.is_active, true), eq(facilities.is_searchable, true)))
        .limit(30),
    ),
    tryCatch(
      pool.query<{ facility_id: string; pending: string; confirmed: string }>(
        `SELECT facility_id::text,
          COUNT(*) FILTER (WHERE status = 'pending')::text AS pending,
          COUNT(*) FILTER (WHERE status = 'confirmed')::text AS confirmed
         FROM appointments
         WHERE facility_id IS NOT NULL AND status IN ('pending', 'confirmed')
         GROUP BY facility_id`,
      ),
    ),
  ]);

  const queueCounts = new Map<string, { pending: number; confirmed: number }>();
  queueResult.data?.rows.forEach((row) => {
    queueCounts.set(row.facility_id, {
      pending: Number(row.pending || 0),
      confirmed: Number(row.confirmed || 0),
    });
  });

  result.facility_recommendations = buildFacilityRecommendations({
    facilities: facilityResult.data || [],
    queueCounts,
    urgencyScore: result.urgency_score,
    urgencyLevel: String(result.urgency_level),
    symptoms: symptomsText,
    region: typeof region === "string" ? region : undefined,
  });
  result.safety_override_applied = safetyOverrideApplied;
  result.trust_statement = "AI-assisted triage result. Deterministic safety rules, cited references, confidence factors, and facility-routing signals are shown for auditability.";

  // Log to DB (Anonymous)
  const sessionId = crypto.randomUUID();
  await tryCatch(
    db.insert(triageSessions).values({
      id: sessionId,
      session_token: session_token || 'anonymous',
      symptoms_raw: symptomsText,
      age: ageNumber ?? null,
      sex: sexText ?? null,
      urgency_level: result.urgency_level,
      urgency_score: result.urgency_score,
      region: region || 'Unknown',
      language: language || 'English',
    })
  );

  res.json(result);
};

export const getHistory = async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.json({ history: [], summary: "" });

  const history = await tryCatch(
    db.select()
      .from(triageSessions)
      .where(eq(triageSessions.session_token, token))
      .orderBy(desc(triageSessions.created_at))
  );

  if (history.error || !history.data) {
    return res.status(500).json({ message: "Failed to fetch history" });
  }

  // Generate AI summary if enough data
  let aiSummary = "";
  if (history.data.length >= 2) {
    const symptomList = history.data.map((h: any) => `[${h.created_at?.toLocaleDateString?.() || 'recent'}] ${h.symptoms_raw} (Urgency: ${h.urgency_score}/10)`).join('\n');
    const summaryPrompt = `You are Haliya, a health intelligence AI. Analyze this patient's symptom history and produce a 2-3 sentence actionable health insight. Be specific — mention which symptoms recur, what the trend suggests, and what action to take. Do NOT use generic advice.

Patient History:
${symptomList}

Respond with ONLY the summary text, no JSON.`;
    const comp = await tryCatch(
      groq.chat.completions.create({
        messages: [{ role: "user", content: summaryPrompt }],
        model: env.GROQ_MODEL,
        max_tokens: 200,
      })
    );
    if (comp.data) aiSummary = comp.data.choices[0]?.message.content || "";
  } else if (history.data.length === 1) {
    aiSummary = "You have 1 assessment on file. Complete more triage checks to unlock AI health trend analysis.";
  }

  res.json({
    history: history.data,
    summary: aiSummary
  });
};

export const getHealthSummary = async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.json({ summary: "", report_count: 0, top_symptom: null });

  const history = await tryCatch(
    db.select().from(triageSessions).where(eq(triageSessions.session_token, token)).orderBy(desc(triageSessions.created_at))
  );
  if (history.error || !history.data || history.data.length === 0) {
    return res.json({ summary: "No health data available yet. Complete your first symptom check to begin tracking.", report_count: 0, top_symptom: null });
  }

  const symptomList = history.data.map((h: any) => `- ${h.symptoms_raw} (Score: ${h.urgency_score}/10)`).join('\n');
  const prompt = `Analyze this patient's ${history.data.length} triage reports and produce a JSON response:
${symptomList}

Respond in strict JSON:
{
  "summary": "<2-3 sentence personalized health insight with specific recommendations>",
  "trend": "improving" | "stable" | "worsening",
  "top_symptom": "<most frequently reported symptom>",
  "risk_level": "low" | "moderate" | "high"
}`;

  const comp = await tryCatch(
    groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: env.GROQ_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 300,
    })
  );

  let result = { summary: "Unable to generate summary.", trend: "stable", top_symptom: null, risk_level: "low" };
  if (comp.data) {
    try { result = JSON.parse(comp.data.choices[0]?.message.content || "{}"); } catch {}
  }

  res.json({ ...result, report_count: history.data.length });
};
