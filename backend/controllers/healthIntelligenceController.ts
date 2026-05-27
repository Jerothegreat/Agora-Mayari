import type { Request, Response } from "express";
import { Groq } from "groq-sdk";
import crypto from "crypto";
import { env } from "../configs/envalid.js";
import { db } from "../configs/db.js";
import { triageSessions } from "./triageController.js";
import { pgTable, text, real, timestamp, varchar } from "drizzle-orm/pg-core";
import { and, sql, eq, desc, gte } from "drizzle-orm";
import { tryCatch } from "../utils/tryCatch.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ACTIVE_ALERT_WINDOW_MS = 72 * 60 * 60 * 1000;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_IN_MS);
const roundToSingleDecimal = (value: unknown) => Math.round(Number(value || 0) * 10) / 10;
const getErrorCode = (error: unknown) => {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }
  return "";
};
const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const isMissingRelationError = (error: unknown, relationName: string) => {
  const message = getErrorMessage(error).toLowerCase();
  return getErrorCode(error) === "42P01" || (message.includes(relationName) && message.includes("does not exist"));
};

const symptomSignals = [
  { label: "Fever", tokens: ["fever", "lagnat"] },
  { label: "Cough", tokens: ["cough", "ubo"] },
  { label: "Shortness of Breath", tokens: ["shortness of breath", "difficulty breathing", "hingal"] },
  { label: "Headache", tokens: ["headache", "sakit ng ulo"] },
  { label: "Dizziness", tokens: ["dizziness", "nahihilo", "pagkahilo"] },
  { label: "Sore Throat", tokens: ["sore throat", "masakit lalamunan"] },
  { label: "Chest Pain", tokens: ["chest pain", "pananakit ng dibdib"] },
  { label: "Nausea", tokens: ["nausea", "pagduduwal"] },
  { label: "Fatigue", tokens: ["fatigue", "panghihina"] },
  { label: "Body Aches", tokens: ["body aches", "body ache", "pananakit ng katawan"] },
  { label: "Vomiting", tokens: ["vomiting", "pagsusuka", "sumusuka"] },
  { label: "Diarrhea", tokens: ["diarrhea", "pagtatae", "loose stool"] },
  { label: "Rash", tokens: ["rash", "pantal"] },
  { label: "Abdominal Pain", tokens: ["abdominal pain", "stomach pain", "sakit ng tiyan"] },
] as const;

type SymptomCluster = (typeof symptomSignals)[number]["label"] | "Mixed Symptoms";

type SessionSignal = {
  region: string | null;
  symptoms: string | null;
  urgency: number | null;
  created_at: Date | null;
};

type AnomalySignal = {
  region: string;
  symptom_cluster: SymptomCluster;
  recent_count: number;
  baseline_count: number;
  expected_count: number;
  spike_percentage: number;
  z_score: number;
  avg_urgency: number;
  severity: "watch" | "alert" | "warning";
  confidence: number;
  playbook: string[];
};

const severityRank: Record<AnomalySignal["severity"], number> = {
  watch: 1,
  alert: 2,
  warning: 3,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const classifySymptomCluster = (symptoms: string | null): SymptomCluster => {
  const text = (symptoms || "").toLowerCase();
  const match = symptomSignals.find(({ tokens }) => tokens.some((token) => text.includes(token)));
  return match?.label || "Mixed Symptoms";
};

const getSeverity = (zScore: number, spikePercentage: number, avgUrgency: number): AnomalySignal["severity"] => {
  if (zScore >= 3 || spikePercentage >= 200 || avgUrgency >= 7.5) return "warning";
  if (zScore >= 2 || spikePercentage >= 100 || avgUrgency >= 6) return "alert";
  return "watch";
};

const buildPlaybook = (signal: Omit<AnomalySignal, "playbook">): string[] => {
  const actions = [
    `Validate ${signal.symptom_cluster.toLowerCase()} reports in ${signal.region} through barangay health workers or facility intake logs.`,
    `Notify nearby clinics to prepare triage scripts, basic supplies, and fast-lane intake for matching symptoms.`,
    `Publish a plain-language advisory if the signal persists for another monitoring window.`,
  ];

  if (signal.severity === "warning") {
    return [
      `Escalate ${signal.region} to LGU/DOH field verification within 24 hours.`,
      ...actions.slice(0, 2),
    ];
  }

  if (signal.severity === "alert") {
    return [
      actions[0]!,
      actions[1]!,
      "Recheck the anomaly dashboard after the next batch of reports before public escalation.",
    ];
  }

  return [
    actions[0]!,
    "Keep passive surveillance active and watch for acceleration in the next 24-48 hours.",
    "Improve data quality by encouraging more complete symptom duration and location fields.",
  ];
};

const buildAnomalySignals = (sessions: SessionSignal[]): AnomalySignal[] => {
  const recentCutoff = hoursAgo(48);
  const baselineWindows = 7;
  const groups = new Map<string, {
    region: string;
    symptom_cluster: SymptomCluster;
    recent_count: number;
    baseline_count: number;
    recent_urgency_total: number;
  }>();

  sessions.forEach((session) => {
    const region = session.region || "Unknown";
    const symptomCluster = classifySymptomCluster(session.symptoms);
    const key = `${region}::${symptomCluster}`;
    const current = groups.get(key) || {
      region,
      symptom_cluster: symptomCluster,
      recent_count: 0,
      baseline_count: 0,
      recent_urgency_total: 0,
    };

    const createdAt = session.created_at ? new Date(session.created_at) : new Date(0);
    if (createdAt >= recentCutoff) {
      current.recent_count += 1;
      current.recent_urgency_total += Number(session.urgency || 0);
    } else {
      current.baseline_count += 1;
    }

    groups.set(key, current);
  });

  return [...groups.values()]
    .map((group) => {
      const expectedCount = group.baseline_count / baselineWindows;
      const avgUrgency = group.recent_count > 0 ? group.recent_urgency_total / group.recent_count : 0;
      const spikePercentage = expectedCount > 0
        ? ((group.recent_count - expectedCount) / expectedCount) * 100
        : group.recent_count > 0
          ? 100
          : 0;
      const zScore = (group.recent_count - expectedCount) / Math.sqrt(expectedCount + 1);
      const severity = getSeverity(zScore, spikePercentage, avgUrgency);
      const signal = {
        region: group.region,
        symptom_cluster: group.symptom_cluster,
        recent_count: group.recent_count,
        baseline_count: group.baseline_count,
        expected_count: Number(expectedCount.toFixed(1)),
        spike_percentage: Number(spikePercentage.toFixed(1)),
        z_score: Number(zScore.toFixed(2)),
        avg_urgency: Number(avgUrgency.toFixed(1)),
        severity,
        confidence: Number(clamp(0.45 + group.recent_count / 18 + Math.max(zScore, 0) / 8, 0.45, 0.95).toFixed(2)),
      };

      return {
        ...signal,
        playbook: buildPlaybook(signal),
      };
    })
    .filter((signal) => signal.recent_count >= 3 && (signal.z_score >= 1.4 || signal.spike_percentage >= 75 || signal.avg_urgency >= 6))
    .sort((left, right) => {
      const severityDelta = severityRank[right.severity] - severityRank[left.severity];
      if (severityDelta !== 0) return severityDelta;
      return right.z_score - left.z_score;
    });
};

// Temporary model for OutbreakAlert
export const outbreakAlerts = pgTable("outbreak_alerts", {
  id: varchar("id").primaryKey().notNull(),
  symptom_cluster: varchar("symptom_cluster"),
  region: varchar("region"),
  spike_percentage: real("spike_percentage"),
  severity: varchar("severity"),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
});

export const getDashboardSummary = async (req: Request, res: Response) => {
  const last24Hours = hoursAgo(24);
  const activeAlertCutoff = new Date(Date.now() - ACTIVE_ALERT_WINDOW_MS);

  const [result, regionResult, alertsCount] = await Promise.all([
    tryCatch(
      db
        .select({
          count: sql`count(*)`,
          avg_urgency: sql`avg(urgency_score)`,
        })
        .from(triageSessions)
        .where(gte(triageSessions.created_at, last24Hours)),
    ),
    tryCatch(
      db
        .select({
          region: triageSessions.region,
          count: sql`count(*)`,
        })
        .from(triageSessions)
        .where(gte(triageSessions.created_at, last24Hours))
        .groupBy(triageSessions.region)
        .orderBy(desc(sql`count(*)`))
        .limit(1),
    ),
    tryCatch(
      db
        .select({ count: sql`count(*)` })
        .from(outbreakAlerts)
        .where(gte(outbreakAlerts.created_at, activeAlertCutoff)),
    ),
  ]);

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch stats", error: String(result.error) });
  }
  if (regionResult.error || !regionResult.data) {
    return res.status(500).json({ message: "Failed to fetch hotspot region", error: String(regionResult.error) });
  }
  if (alertsCount.error && !isMissingRelationError(alertsCount.error, "outbreak_alerts")) {
    return res.status(500).json({ message: "Failed to fetch active alerts", error: String(alertsCount.error) });
  }

  res.json({
    total_reports_today: Number(result.data![0]!.count),
    avg_urgency_score: roundToSingleDecimal(result.data![0]!.avg_urgency),
    most_affected_region: regionResult.data[0]?.region || "None",
    active_alerts: Number(alertsCount.data?.[0]?.count || 0),
  });
};

export const getRegionalStats = async (req: Request, res: Response) => {
  const lastSevenDays = daysAgo(7);
  const result = await tryCatch(
    db
      .select({
        region: triageSessions.region,
        report_count: sql`count(*)`,
        avg_urgency: sql`avg(urgency_score)`,
      })
      .from(triageSessions)
      .where(gte(triageSessions.created_at, lastSevenDays))
      .groupBy(triageSessions.region),
  );

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch regional stats", error: String(result.error) });
  }

  const data = result.data.map(r => ({
    region: r.region || "Unknown",
    report_count: Number(r.report_count),
    avg_urgency: roundToSingleDecimal(r.avg_urgency),
  }));

  res.json(data);
};

export const getTrends = async (req: Request, res: Response) => {
  const sevenDaysAgo = daysAgo(7);

  const result = await tryCatch(
    db.select({
      date: sql`DATE(created_at)`,
      count: sql`count(*)`
    })
    .from(triageSessions)
    .where(gte(triageSessions.created_at, sevenDaysAgo))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`)
  );

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch trends", error: String(result.error) });
  }

  const data = result.data.map(r => ({
    date: r.date,
    count: Number(r.count)
  }));

  res.json(data);
};

// Generate AI-powered outbreak alerts based on symptom clusters
export const generateIntelligence = async (req: Request, res: Response) => {
  const analysisWindowStart = daysAgo(16);

  const sessions = await db.select({
    region: triageSessions.region,
    symptoms: triageSessions.symptoms_raw,
    urgency: triageSessions.urgency_score,
    created_at: triageSessions.created_at,
  })
  .from(triageSessions)
  .where(gte(triageSessions.created_at, analysisWindowStart));

  if (sessions.length < 5) {
    return res.json({ message: "Insufficient data for AI analysis", alerts_generated: 0 });
  }

  const anomalySignals = buildAnomalySignals(sessions);

  if (anomalySignals.length === 0) {
    return res.json({
      message: "Anomaly engine completed. No statistically significant outbreak signals detected.",
      alerts_generated: 0,
      anomalies: [],
    });
  }

  let alertsGenerated = 0;

  for (const signal of anomalySignals.slice(0, 8)) {
    const prompt = `
      You are Haliya's public-health intelligence assistant. Convert this statistically detected health anomaly into a concise LGU-ready alert.

      Signal:
      Region: ${signal.region}
      Symptom cluster: ${signal.symptom_cluster}
      Recent 48h count: ${signal.recent_count}
      Expected 48h baseline: ${signal.expected_count}
      Spike percentage: ${signal.spike_percentage}%
      Z-score: ${signal.z_score}
      Average urgency: ${signal.avg_urgency}/10
      Severity: ${signal.severity}
      
      Respond strictly in JSON format:
      {
        "message": "Clear, actionable public health warning message for LGU/facility teams"
      }
    `;

    const completion = await tryCatch(
      groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: env.GROQ_MODEL,
        response_format: { type: "json_object" },
      })
    );

    let result: Record<string, unknown> = {};
    if (completion.data) {
      try {
        result = JSON.parse(completion.data.choices[0]!.message.content || "{}");
      } catch {
        result = {};
      }
    }

    const duplicateAlert = await tryCatch(
      db
        .select({ id: outbreakAlerts.id })
        .from(outbreakAlerts)
        .where(
          and(
            eq(outbreakAlerts.region, signal.region),
            eq(outbreakAlerts.symptom_cluster, signal.symptom_cluster),
            gte(outbreakAlerts.created_at, new Date(Date.now() - ACTIVE_ALERT_WINDOW_MS)),
          ),
        )
        .limit(1),
    );

    if (duplicateAlert.data?.length) {
      continue;
    }

    const fallbackMessage = `${signal.severity.toUpperCase()}: ${signal.symptom_cluster} reports in ${signal.region} are ${signal.spike_percentage}% above expected baseline (${signal.recent_count} recent vs ${signal.expected_count} expected). ${signal.playbook[0]}`;

    await db.insert(outbreakAlerts).values({
      id: crypto.randomUUID(),
      region: signal.region,
      symptom_cluster: signal.symptom_cluster,
      spike_percentage: signal.spike_percentage,
      severity: signal.severity,
      message: String(result.message || fallbackMessage),
    });
    alertsGenerated++;
  }

  res.json({ 
    message: `Intelligence analysis complete. ${alertsGenerated} outbreak alerts generated.`,
    alerts_generated: alertsGenerated,
    anomalies: anomalySignals,
  });
};

export const getAnomalySignals = async (req: Request, res: Response) => {
  const sessions = await tryCatch(
    db.select({
      region: triageSessions.region,
      symptoms: triageSessions.symptoms_raw,
      urgency: triageSessions.urgency_score,
      created_at: triageSessions.created_at,
    })
    .from(triageSessions)
    .where(gte(triageSessions.created_at, daysAgo(16))),
  );

  if (sessions.error || !sessions.data) {
    return res.status(500).json({ message: "Failed to compute anomaly signals", error: String(sessions.error) });
  }

  res.json(buildAnomalySignals(sessions.data).slice(0, 8));
};

export const getAlerts = async (req: Request, res: Response) => {
  const result = await tryCatch(
    db
      .select()
      .from(outbreakAlerts)
      .where(gte(outbreakAlerts.created_at, new Date(Date.now() - ACTIVE_ALERT_WINDOW_MS)))
      .orderBy(desc(outbreakAlerts.created_at))
      .limit(5),
  );

  if (result.error) {
    if (isMissingRelationError(result.error, "outbreak_alerts")) {
      return res.json([]);
    }
    return res.status(500).json({ message: "Failed to fetch alerts", error: String(result.error) });
  }

  res.json(result.data);
};

export const getTopSymptoms = async (req: Request, res: Response) => {
  const sessions = await tryCatch(
    db
      .select({ symptoms: triageSessions.symptoms_raw })
      .from(triageSessions)
      .where(gte(triageSessions.created_at, daysAgo(7))),
  );
  if (sessions.error || !sessions.data) return res.json([]);

  const counts: Record<string, number> = {};
  symptomSignals.forEach(({ label }) => {
    counts[label] = 0;
  });

  sessions.data.forEach((s) => {
    const text = (s.symptoms || "").toLowerCase();
    symptomSignals.forEach(({ label, tokens }) => {
      if (tokens.some((token) => text.includes(token))) {
        counts[label] = (counts[label] ?? 0) + 1;
      }
    });
  });

  const sorted = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symptom, count]) => ({ symptom, count }));

  res.json(sorted);
};
