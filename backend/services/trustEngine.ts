import type { Facility } from "../models/facilityModel.js";

export type EvidenceSource = {
  title: string;
  publisher: string;
  url: string;
  relevance: string;
};

export type RuleSeverity = "info" | "caution" | "urgent" | "emergency";

export type RuleTrigger = {
  id: string;
  label: string;
  severity: RuleSeverity;
  matched: string[];
  score_impact: number;
  rationale: string;
};

export type EvidenceLedger = {
  audit_id: string;
  generated_at: string;
  model: string;
  score_basis: string[];
  rules_triggered: RuleTrigger[];
  sources: EvidenceSource[];
  confidence_factors: string[];
};

export type FacilityRecommendation = {
  id: string;
  name: string;
  type: string | null;
  location: string;
  score: number;
  queue_load: number;
  estimated_wait_minutes: number;
  capability_tags: string[];
  match_reason: string;
  is_verified: boolean;
};

type QueueCount = {
  pending: number;
  confirmed: number;
};

type SafetyInput = {
  symptoms: string;
  age?: number | undefined;
  duration?: string | undefined;
  conditions: string[];
};

type BuildLedgerInput = SafetyInput & {
  auditId: string;
  model: string;
  aiScore: number;
  aiUrgencyLevel: string;
  confidence?: number | undefined;
};

type FacilityRecommendationInput = {
  facilities: Facility[];
  queueCounts: Map<string, QueueCount>;
  urgencyScore: number;
  urgencyLevel: string;
  symptoms: string;
  region?: string | undefined;
};

const TRUSTED_SOURCES: Record<string, EvidenceSource> = {
  emergencyCardio: {
    title: "Cardiovascular diseases: heart attack and stroke symptoms",
    publisher: "World Health Organization",
    url: "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)",
    relevance: "Emergency escalation for chest pain with shortness of breath, radiation, sweating, faintness, or pallor.",
  },
  strokeFast: {
    title: "Signs and Symptoms of Stroke",
    publisher: "Centers for Disease Control and Prevention",
    url: "https://www.cdc.gov/stroke/signs-symptoms/index.html",
    relevance: "FAST warning signs and sudden neurologic symptoms requiring emergency care.",
  },
  dengue: {
    title: "Dengue and severe dengue",
    publisher: "World Health Organization",
    url: "https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue",
    relevance: "Dengue warning signs including severe abdominal pain, persistent vomiting, rapid breathing, and bleeding.",
  },
  tuberculosis: {
    title: "Tuberculosis",
    publisher: "World Health Organization",
    url: "https://www.who.int/news-room/fact-sheets/detail/tuberculosis",
    relevance: "Persistent cough, fever, night sweats, weight loss, and blood in sputum patterns.",
  },
  smartGuidelines: {
    title: "SMART Guidelines",
    publisher: "World Health Organization",
    url: "https://www.who.int/teams/digital-health-and-innovation/smart-guidelines",
    relevance: "Standards-based, testable digital decision-support guidance.",
  },
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const unique = <T>(values: T[]) => [...new Set(values)];

const matchTerms = (text: string, terms: string[]) => terms.filter((term) => text.includes(term));

const parseDurationDays = (input?: string) => {
  if (!input) return null;
  const normalized = normalize(input);
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match?.[1]) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;

  if (normalized.includes("week")) return value * 7;
  if (normalized.includes("month")) return value * 30;
  if (normalized.includes("year")) return value * 365;
  if (normalized.includes("hour") || normalized.includes("hr")) return value / 24;
  return value;
};

export const buildSafetyRules = ({ symptoms, age, duration, conditions }: SafetyInput): RuleTrigger[] => {
  const text = normalize(`${symptoms} ${conditions.join(" ")}`);
  const durationDays = parseDurationDays(duration);
  const rules: RuleTrigger[] = [];

  const cardioMatches = matchTerms(text, [
    "chest pain radiating",
    "pain radiating to arm",
    "pain radiating to jaw",
    "crushing chest pain",
    "cold sweat",
    "fainting",
  ]);
  if ((text.includes("chest pain") || text.includes("pananakit ng dibdib")) && (text.includes("shortness of breath") || text.includes("difficulty breathing") || text.includes("hingal") || cardioMatches.length > 0)) {
    rules.push({
      id: "cardio-emergency",
      label: "Heart attack red-flag pattern",
      severity: "emergency",
      matched: unique(["chest pain", ...cardioMatches]),
      score_impact: 10,
      rationale: "Chest pain with breathing difficulty, radiation, faintness, or sweating is treated as an emergency safety override.",
    });
  }

  const breathingMatches = matchTerms(text, ["difficulty breathing", "shortness of breath at rest", "cannot breathe", "blue lips", "rapid breathing"]);
  if (breathingMatches.length > 0) {
    rules.push({
      id: "respiratory-distress",
      label: "Breathing distress",
      severity: "emergency",
      matched: breathingMatches,
      score_impact: 10,
      rationale: "Breathing distress is escalated because oxygen or emergency assessment may be needed.",
    });
  }

  const strokeMatches = matchTerms(text, [
    "face droop",
    "facial droop",
    "slurred speech",
    "one-sided weakness",
    "sudden weakness",
    "sudden vision loss",
    "sudden confusion",
    "stroke symptoms",
  ]);
  if (strokeMatches.length > 0) {
    rules.push({
      id: "stroke-fast",
      label: "Stroke FAST warning signs",
      severity: "emergency",
      matched: strokeMatches,
      score_impact: 10,
      rationale: "Sudden neurologic symptoms are treated as time-sensitive emergency warning signs.",
    });
  }

  const bleedingMatches = matchTerms(text, ["internal bleeding", "blood in stool", "vomiting blood", "severe bleeding", "uncontrolled bleeding"]);
  if (bleedingMatches.length > 0) {
    rules.push({
      id: "bleeding-emergency",
      label: "Bleeding red flags",
      severity: "emergency",
      matched: bleedingMatches,
      score_impact: 10,
      rationale: "Possible internal or uncontrolled bleeding requires immediate escalation.",
    });
  }

  const dengueMatches = matchTerms(text, ["fever", "lagnat", "rash", "pantal", "severe abdominal pain", "persistent vomiting", "bleeding gums", "nose bleed"]);
  const hasDengueSignal = (text.includes("fever") || text.includes("lagnat")) && dengueMatches.length >= 2;
  if (hasDengueSignal) {
    const severeDengueTerms = dengueMatches.filter((term) => ["severe abdominal pain", "persistent vomiting", "bleeding gums", "nose bleed"].includes(term));
    rules.push({
      id: "dengue-watch",
      label: severeDengueTerms.length ? "Dengue warning signs" : "Dengue-like symptom cluster",
      severity: severeDengueTerms.length ? "urgent" : "caution",
      matched: dengueMatches,
      score_impact: severeDengueTerms.length ? 3 : 1,
      rationale: severeDengueTerms.length
        ? "Dengue warning signs should be clinically assessed promptly in dengue-endemic settings."
        : "Fever with rash or body symptoms is tracked as a dengue-relevant cluster in the Philippines.",
    });
  }

  const tbMatches = matchTerms(text, ["cough", "ubo", "blood", "night sweats", "weight loss", "fever"]);
  if ((text.includes("cough") || text.includes("ubo")) && durationDays !== null && durationDays >= 14) {
    rules.push({
      id: "tb-persistence",
      label: "Persistent cough pattern",
      severity: "caution",
      matched: tbMatches,
      score_impact: 1,
      rationale: "A cough lasting two weeks or more should be evaluated for respiratory infection patterns including TB.",
    });
  }

  if (age !== undefined && (age < 5 || age >= 65)) {
    rules.push({
      id: "vulnerable-age",
      label: "Age vulnerability modifier",
      severity: "caution",
      matched: [`age ${age}`],
      score_impact: 1,
      rationale: "Very young children and older adults have lower reserve and may need earlier clinical assessment.",
    });
  }

  if (durationDays !== null && durationDays >= 7) {
    rules.push({
      id: "persistent-symptoms",
      label: "Persistent symptom duration",
      severity: "caution",
      matched: [`${Math.round(durationDays)} days`],
      score_impact: 1,
      rationale: "Symptoms persisting for a week or more deserve additional attention even when individual symptoms look mild.",
    });
  }

  return rules;
};

export const getMinimumScoreFromRules = (rules: RuleTrigger[]) => {
  if (rules.some((rule) => rule.severity === "emergency")) return 9;
  if (rules.some((rule) => rule.severity === "urgent")) return 7;
  return null;
};

export const urgencyLevelFromScore = (score: number) => {
  if (score >= 9) return "emergency";
  if (score >= 7) return "er";
  if (score >= 4) return "clinic";
  return "self-care";
};

export const buildEvidenceLedger = ({
  symptoms,
  age,
  duration,
  conditions,
  auditId,
  model,
  aiScore,
  aiUrgencyLevel,
  confidence,
}: BuildLedgerInput): EvidenceLedger => {
  const rules = buildSafetyRules({
    symptoms,
    conditions,
    ...(age !== undefined ? { age } : {}),
    ...(duration !== undefined ? { duration } : {}),
  });
  const sourceKeys = new Set<keyof typeof TRUSTED_SOURCES>(["smartGuidelines"]);

  rules.forEach((rule) => {
    if (rule.id.includes("cardio")) sourceKeys.add("emergencyCardio");
    if (rule.id.includes("stroke")) sourceKeys.add("strokeFast");
    if (rule.id.includes("dengue")) sourceKeys.add("dengue");
    if (rule.id.includes("tb")) sourceKeys.add("tuberculosis");
  });

  const missingContext = [
    age === undefined ? "age not provided" : null,
    !duration ? "duration not provided" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    audit_id: auditId,
    generated_at: new Date().toISOString(),
    model,
    score_basis: [
      `Model returned ${aiScore}/10 (${aiUrgencyLevel}).`,
      rules.length
        ? `${rules.length} deterministic safety rule${rules.length === 1 ? "" : "s"} evaluated and attached to this result.`
        : "No deterministic emergency override was triggered.",
      missingContext.length
        ? `Confidence adjusted because ${missingContext.join(" and ")}.`
        : "Patient context included enough basic demographics/duration for standard scoring.",
    ],
    rules_triggered: rules,
    sources: [...sourceKeys].map((key) => TRUSTED_SOURCES[key]).filter((source): source is EvidenceSource => Boolean(source)),
    confidence_factors: [
      confidence !== undefined ? `Model confidence: ${Math.round(confidence * 100)}%.` : "Model did not return a confidence score.",
      missingContext.length ? `Missing context: ${missingContext.join(", ")}.` : "Age and duration were available or not needed for the triggered rules.",
      rules.some((rule) => rule.severity === "emergency")
        ? "Emergency override present; recommendation should be treated conservatively."
        : "No emergency override present; recommendation remains AI-assisted and should be clinically verified when symptoms worsen.",
    ],
  };
};

const arrayFromJson = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const getLocationText = (facility: Facility) => normalize([
  facility.location,
  facility.address,
  facility.city,
  facility.province,
  facility.country,
].filter(Boolean).join(" "));

const neededCapabilityTags = (urgencyScore: number, symptoms: string) => {
  const text = normalize(symptoms);
  const tags = new Set<string>();

  if (urgencyScore >= 7) tags.add("emergency");
  if (text.includes("chest") || text.includes("heart") || text.includes("dibdib")) tags.add("cardiology");
  if (text.includes("pregnan")) tags.add("obstetrics");
  if (text.includes("child") || text.includes("baby") || text.includes("infant")) tags.add("pediatrics");
  if (text.includes("rash") || text.includes("pantal")) tags.add("dermatology");
  if (text.includes("cough") || text.includes("ubo") || text.includes("breath") || text.includes("hingal")) tags.add("pulmonary");
  if (tags.size === 0) tags.add(urgencyScore >= 4 ? "primary care" : "barangay care");

  return [...tags];
};

export const buildFacilityRecommendations = ({
  facilities,
  queueCounts,
  urgencyScore,
  urgencyLevel,
  symptoms,
  region,
}: FacilityRecommendationInput): FacilityRecommendation[] => {
  const neededTags = neededCapabilityTags(urgencyScore, symptoms);
  const normalizedRegion = normalize(region || "");

  return facilities
    .map((facility) => {
      const services = arrayFromJson(facility.services);
      const specialties = arrayFromJson(facility.specialties);
      const allCapabilities = [...services, ...specialties, facility.type || ""].map(normalize);
      const location = [facility.city, facility.province].filter(Boolean).join(", ") || facility.location || facility.address || "Philippines";
      const locationText = getLocationText(facility);
      const queue = queueCounts.get(facility.id) || { pending: 0, confirmed: 0 };
      const queueLoad = queue.pending + queue.confirmed;
      const type = normalize(facility.type || "");
      const sameRegion = normalizedRegion.length > 0 && locationText.includes(normalizedRegion);
      const capabilityMatches = neededTags.filter((tag) => allCapabilities.some((capability) => capability.includes(tag)));
      const emergencyReady = allCapabilities.some((capability) => ["emergency", "er", "hospital", "urgent"].some((tag) => capability.includes(tag))) || type.includes("hospital");
      const primaryReady = allCapabilities.some((capability) => ["primary", "clinic", "rhu", "barangay"].some((tag) => capability.includes(tag))) || type.includes("clinic");

      let score = 45;
      if (sameRegion) score += 20;
      if (facility.is_verified) score += 10;
      score += Math.min(capabilityMatches.length * 12, 24);
      if (urgencyScore >= 7 && emergencyReady) score += 20;
      if (urgencyScore < 7 && primaryReady) score += 12;
      score -= Math.min(queueLoad * 3, 24);

      if (urgencyLevel === "emergency" && !emergencyReady) score -= 20;

      const estimatedWait = Math.max(15, 20 + queueLoad * 12 - (facility.is_verified ? 5 : 0) - (sameRegion ? 5 : 0));
      const reasons = [
        sameRegion ? "same-region match" : null,
        capabilityMatches.length ? `matches ${capabilityMatches.join(", ")}` : null,
        emergencyReady && urgencyScore >= 7 ? "emergency-capable" : null,
        primaryReady && urgencyScore < 7 ? "primary-care fit" : null,
        `${queueLoad} active queue item${queueLoad === 1 ? "" : "s"}`,
      ].filter((item): item is string => Boolean(item));

      return {
        id: facility.id,
        name: facility.name,
        type: facility.type,
        location,
        score: Math.max(0, Math.min(100, Math.round(score))),
        queue_load: queueLoad,
        estimated_wait_minutes: Math.round(estimatedWait),
        capability_tags: unique([...neededTags, ...capabilityMatches]).slice(0, 4),
        match_reason: reasons.join(" • "),
        is_verified: facility.is_verified,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
};
