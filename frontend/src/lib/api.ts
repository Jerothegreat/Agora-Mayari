export interface TriageRequest {
  symptoms: string;
  age?: number;
  sex?: string;
  duration?: string;
  conditions?: string[];
  language?: string;
  session_token?: string;
  region?: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  likelihood: 'High' | 'Moderate' | 'Low';
  reasoning: string;
}

export interface EvidenceSource {
  title: string;
  publisher: string;
  url: string;
  relevance: string;
}

export interface RuleTrigger {
  id: string;
  label: string;
  severity: 'info' | 'caution' | 'urgent' | 'emergency';
  matched: string[];
  score_impact: number;
  rationale: string;
}

export interface EvidenceLedger {
  audit_id: string;
  generated_at: string;
  model: string;
  score_basis: string[];
  rules_triggered: RuleTrigger[];
  sources: EvidenceSource[];
  confidence_factors: string[];
}

export interface FacilityRecommendation {
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
}

export interface TriageResponse {
  urgency_level: 'self-care' | 'clinic' | 'er' | 'emergency';
  urgency_score: number;
  classification?: string;
  summary: string;
  differential_diagnosis?: DifferentialDiagnosis[];
  red_flags?: string[];
  recommended_facility_type?: string;
  next_steps: string[];
  explanation: string;
  confidence_level?: number;
  pattern_detected?: boolean;
  pattern_description?: string;
  evidence_ledger?: EvidenceLedger;
  facility_recommendations?: FacilityRecommendation[];
  safety_override_applied?: boolean;
  trust_statement?: string;
}

export type VoiceTranscriptTurn = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

export type StartVoiceSessionResponse = {
  channelName: string;
  token: string;
  uid: string;
  agentId: string;
  sessionId: string;
};

export type EndVoiceSessionRequest = {
  sessionId: string;
  agentId: string;
  channelName: string;
  transcript: VoiceTranscriptTurn[];
  urgency: "low" | "medium" | "high" | null;
  specialty: string | null;
};

export type EndVoiceSessionResponse = {
  sessionId: string;
  triageResult: TriageResponse;
  urgency: "low" | "medium" | "high";
  specialty: string;
  appointmentId: string | null;
};

export interface DashboardSummary {
  total_reports_today: number;
  avg_urgency_score: number;
  most_affected_region: string;
  active_alerts: number;
}

export interface RegionStat {
  region: string;
  report_count: number;
  avg_urgency: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface Alert {
  id: string;
  symptom_cluster: string;
  region: string;
  spike_percentage: number;
  severity: 'watch' | 'alert' | 'warning';
  message: string;
  created_at: string;
}

export interface AnomalySignal {
  region: string;
  symptom_cluster: string;
  recent_count: number;
  baseline_count: number;
  expected_count: number;
  spike_percentage: number;
  z_score: number;
  avg_urgency: number;
  severity: 'watch' | 'alert' | 'warning';
  confidence: number;
  playbook: string[];
}

const normalizeApiUrl = (value: string) => value.replace(/\/+$/, '');

const ensureApiSuffix = (value: string) => {
  const normalized = normalizeApiUrl(value.trim());
  if (!normalized) {
    return '';
  }

  // Preserve explicit api paths and append /api when only an origin is provided.
  if (/^https?:\/\//i.test(normalized)) {
    const parsed = new URL(normalized);
    const pathname = normalizeApiUrl(parsed.pathname || '/');
    if (!pathname || pathname === '') {
      parsed.pathname = '/api';
    } else if (pathname !== '/api' && !pathname.startsWith('/api/')) {
      parsed.pathname = `${pathname}/api`;
    }
    return normalizeApiUrl(parsed.toString());
  }

  if (normalized === '/') {
    return '/api';
  }

  if (normalized === '/api' || normalized.startsWith('/api/')) {
    return normalized;
  }

  return `${normalized}/api`;
};

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

const getDefaultApiBase = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const API_URL = ensureApiSuffix(configuredApiUrl || getDefaultApiBase()) || '/api';

const parseErrorMessage = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null) as { message?: string, error?: unknown } | null;
    if (payload?.message) {
      return payload.message;
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text.trim()) {
      const lowered = text.trim().toLowerCase();
      if (lowered.startsWith('<!doctype html') || lowered.startsWith('<html')) {
        return `${fallbackMessage}. The API at "${API_URL}" responded with HTML instead of JSON. This usually means the API endpoint is missing, misconfigured, or the backend crashed. Check NEXT_PUBLIC_API_URL and the local backend environment variables.`;
      }
      return text.trim();
    }
  }

  return fallbackMessage;
};

const readJson = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }

  return response.json() as Promise<T>;
};

export async function getTriage(data: TriageRequest): Promise<TriageResponse> {
  const response = await fetch(`${API_URL}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return readJson(response, 'Failed to get triage result');
}

export async function startVoiceSession(): Promise<{ success: true; data: StartVoiceSessionResponse }> {
  const response = await fetch(`${API_URL}/agora/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return readJson(response, "Failed to start voice session");
}

export async function endVoiceSession(
  data: EndVoiceSessionRequest,
): Promise<{ success: true; data: EndVoiceSessionResponse }> {
  const response = await fetch(`${API_URL}/agora/session/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(response, "Failed to end voice session");
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_URL}/dashboard/summary`);
  return readJson(response, 'Failed to fetch dashboard summary');
}

export async function getByRegion(): Promise<RegionStat[]> {
  const response = await fetch(`${API_URL}/dashboard/regional`);
  return readJson(response, 'Failed to fetch regional stats');
}

export async function getTrend(): Promise<TrendData[]> {
  const response = await fetch(`${API_URL}/dashboard/trends`);
  return readJson(response, 'Failed to fetch trend data');
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const response = await fetch(`${API_URL}/alerts`);
  return readJson(response, 'Failed to fetch active alerts');
}

export async function getAnomalySignals(): Promise<AnomalySignal[]> {
  const response = await fetch(`${API_URL}/dashboard/anomalies`);
  return readJson(response, 'Failed to fetch anomaly signals');
}

export async function getHistory(token: string): Promise<{ history: Array<{
  id: string;
  urgency_level: string;
  created_at: string;
  symptoms_raw: string;
  age?: number | null;
  sex?: string | null;
  urgency_score: number;
}>; summary: string }> {
  const response = await fetch(`${API_URL}/triage/history?token=${token}`);
  return readJson(response, 'Failed to fetch history');
}

export async function generateIntelligence(): Promise<{ message: string, alerts_generated: number, anomalies?: AnomalySignal[] }> {
  const response = await fetch(`${API_URL}/intelligence/generate`, { method: 'POST' });
  return readJson(response, 'Failed to generate intelligence');
}

export interface FeedbackMetrics {
  total_reviews: number;
  agreement_rate: number;
  corrections: {
    ai_under_triaged: number;
    ai_over_triaged: number;
  };
  confusion_matrix: Array<{
    ai: string;
    clinician: string;
    count: number;
  }>;
}

export interface HealthSummary {
  summary: string;
  trend: 'improving' | 'stable' | 'worsening';
  top_symptom: string | null;
  risk_level: 'low' | 'moderate' | 'high';
  report_count: number;
}

export interface PatientProfile {
  id: string;
  email: string;
  full_name?: string | null;
  personal_info?: {
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  };
  medical_info?: {
    allergies?: string[];
    surgeries?: string[];
    medications?: string[];
    conditions?: Record<string, unknown>;
  };
}

export interface FacilityProfile {
  id: string;
  name: string;
  type?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  website?: string | null;
  specialties?: string[];
  services?: string[];
  operating_hours?: Record<string, unknown>;
  staff?: Record<string, unknown>;
  capacity?: Record<string, unknown>;
  languages?: string[];
  accreditation?: string[];
  insurance_accepted?: string[];
  license_number?: string | null;
  description?: string | null;
}

export async function getHealthSummary(token: string): Promise<HealthSummary> {
  const response = await fetch(`${API_URL}/triage/health-summary?token=${token}`);
  return readJson(response, 'Failed to fetch health summary');
}

export async function getPatientProfile(token: string): Promise<PatientProfile> {
  const response = await fetch(`${API_URL}/patients/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return readJson(response, 'Failed to fetch patient profile');
}

export async function updatePatientProfile(token: string, payload: Partial<PatientProfile>): Promise<PatientProfile> {
  const response = await fetch(`${API_URL}/patients/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return readJson(response, 'Failed to update patient profile');
}

export async function getFacilityProfile(token: string): Promise<FacilityProfile> {
  const response = await fetch(`${API_URL}/facilities/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return readJson(response, 'Failed to fetch facility profile');
}

export async function updateFacilityProfile(token: string, payload: Partial<FacilityProfile>): Promise<FacilityProfile> {
  const response = await fetch(`${API_URL}/facilities/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return readJson(response, 'Failed to update facility profile');
}

export async function deleteMyAccount(token: string, sessionToken?: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ session_token: sessionToken }),
  });
  return readJson(response, 'Failed to delete account');
}

export interface TopSymptom {
  symptom: string;
  count: number;
}

export async function getTopSymptoms(): Promise<TopSymptom[]> {
  const response = await fetch(`${API_URL}/dashboard/top-symptoms`);
  return readJson(response, 'Failed to fetch top symptoms');
}
