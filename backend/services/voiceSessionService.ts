import { randomUUID } from "node:crypto";
import agoraToken from "agora-token";

const { RtcRole, RtcTokenBuilder } = agoraToken;

const AGORA_HEX_ID_LENGTH = 32;
const AGORA_REST_BASE_URL = "https://api.agora.io/api/conversational-ai-agent/v2/projects";

export interface VoiceSessionStartInput {
  name?: string;
  channel?: string;
  enable_string_uid?: boolean;
  idle_timeout?: number;
  token_expiration_seconds?: number;
}

export interface VoiceSessionStartResult {
  sessionId: string;
  appId: string;
  channel: string;
  client: {
    rtcUid: string;
    rtcToken: string;
  };
  agent: {
    rtcUid: string;
    agentId: string;
    createTs: number;
    status: string;
  };
}

interface AgoraCredentials {
  appId: string;
  pipelineId: string;
  appCertificate: string;
}

interface AgoraJoinSuccessResponse {
  agent_id: string;
  create_ts: number;
  status: string;
}

interface AgoraJoinRequestBody {
  name: string;
  pipeline_id: string;
  properties: Record<string, unknown>;
}

export class VoiceSessionError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details: Record<string, unknown>,
  ) {
    super(code);
  }
}

export async function createVoiceSession(
  input: VoiceSessionStartInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<VoiceSessionStartResult> {
  const credentials = readAgoraCredentials(env);
  const sessionId = normalizeSessionId(randomUUID());
  const channel = input.channel?.trim() || `haliya-triage-${sessionId}`;
  const enableStringUid = input.enable_string_uid ?? true;
  const tokenExpirationSeconds = input.token_expiration_seconds ?? 3600;
  const idleTimeout = input.idle_timeout ?? 120;
  const agentRtcUid = buildRtcUid("agent", sessionId, enableStringUid);
  const clientRtcUid = buildRtcUid("client", sessionId, enableStringUid);
  const clientRtcToken = buildRtcPublisherToken(
    credentials.appId,
    credentials.appCertificate,
    channel,
    clientRtcUid,
    tokenExpirationSeconds,
  );
  const agentRtcToken = buildRtcPublisherToken(
    credentials.appId,
    credentials.appCertificate,
    channel,
    agentRtcUid,
    tokenExpirationSeconds,
  );
  const joinRequestBody = buildAgoraJoinRequestBody(
    input,
    credentials.pipelineId,
    sessionId,
    channel,
    agentRtcUid,
    agentRtcToken,
    idleTimeout,
  );
  const joinResponse = await startAgoraAgent(joinRequestBody, credentials);

  return {
    sessionId,
    appId: credentials.appId,
    channel,
    client: {
      rtcUid: clientRtcUid,
      rtcToken: clientRtcToken,
    },
    agent: {
      rtcUid: agentRtcUid,
      agentId: joinResponse.agent_id,
      createTs: joinResponse.create_ts,
      status: joinResponse.status,
    },
  };
}

function buildAgoraJoinRequestBody(
  input: VoiceSessionStartInput,
  pipelineId: string,
  sessionId: string,
  channel: string,
  agentRtcUid: string,
  agentRtcToken: string,
  idleTimeout: number,
): AgoraJoinRequestBody {
  const properties: Record<string, unknown> = {
    channel,
    token: agentRtcToken,
    agent_rtc_uid: agentRtcUid,
    remote_rtc_uids: ["*"],
    enable_string_uid: input.enable_string_uid ?? true,
  };

  if (idleTimeout !== 120 || input.idle_timeout !== undefined) {
    properties.idle_timeout = idleTimeout;
  }

  return {
    name: input.name?.trim() || `haliya-agent-${sessionId}`,
    pipeline_id: pipelineId,
    properties,
  };
}

async function startAgoraAgent(
  body: AgoraJoinRequestBody,
  credentials: AgoraCredentials,
): Promise<AgoraJoinSuccessResponse> {
  const agentRtcToken = String(body.properties.token);
  const response = await fetch(`${AGORA_REST_BASE_URL}/${credentials.appId}/join`, {
    method: "POST",
    headers: {
      Authorization: `agora token=${agentRtcToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new VoiceSessionError(502, "voice_session_start_failed", {
      provider: "agora",
      reason: readProviderReason(payload),
      detail: readProviderDetail(payload),
      http_status: response.status,
    });
  }

  if (!isAgoraJoinSuccessResponse(payload)) {
    throw new VoiceSessionError(502, "voice_session_start_failed", {
      provider: "agora",
      reason: "invalid_response",
      detail: "Agora join response was missing one or more required fields.",
    });
  }

  return payload;
}

function buildRtcUid(
  role: "client" | "agent",
  sessionId: string,
  enableStringUid: boolean,
): string {
  if (enableStringUid) {
    return `${role}_${sessionId.slice(0, 12)}`;
  }

  const sessionSegment = role === "client" ? sessionId.slice(0, 8) : sessionId.slice(8, 16);
  const numericSeed = Number.parseInt(sessionSegment, 16);
  return String((numericSeed % 900000) + 100000);
}

function buildRtcPublisherToken(
  appId: string,
  appCertificate: string,
  channel: string,
  rtcUid: string,
  expireInSeconds: number,
): string {
  return RtcTokenBuilder.buildTokenWithUserAccount(
    appId,
    appCertificate,
    channel,
    rtcUid,
    RtcRole.PUBLISHER,
    expireInSeconds,
    expireInSeconds,
  );
}

function readAgoraCredentials(env: NodeJS.ProcessEnv): AgoraCredentials {
  const appId = env.AGORA_APP_ID;
  const pipelineId = env.AGORA_PIPELINE_ID;
  const appCertificate = env.AGORA_APP_CERTIFICATE;

  if (!appId || !isAgoraHexId(appId)) {
    throw new VoiceSessionError(500, "missing_agora_app_id", {
      provider: "backend",
      detail: "AGORA_APP_ID must be configured as a 32-character hexadecimal string.",
    });
  }

  if (!appCertificate || !isAgoraHexId(appCertificate)) {
    throw new VoiceSessionError(500, "missing_agora_app_certificate", {
      provider: "backend",
      detail: "AGORA_APP_CERTIFICATE must be configured as a 32-character hexadecimal string.",
    });
  }

  if (!pipelineId || !isAgoraHexId(pipelineId)) {
    throw new VoiceSessionError(500, "missing_agora_pipeline_id", {
      provider: "backend",
      detail: "AGORA_PIPELINE_ID must be configured as a 32-character hexadecimal string.",
    });
  }

  return {
    appId,
    appCertificate,
    pipelineId,
  };
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return { raw: rawText } satisfies Record<string, unknown>;
  }
}

function readProviderReason(payload: unknown): string {
  if (isRecord(payload) && typeof payload.reason === "string") {
    return payload.reason;
  }

  return "request_failed";
}

function readProviderDetail(payload: unknown): string {
  if (isRecord(payload) && typeof payload.detail === "string") {
    return payload.detail;
  }

  if (isRecord(payload) && typeof payload.raw === "string") {
    return payload.raw;
  }

  return "Agora rejected the session start request.";
}

function isAgoraJoinSuccessResponse(value: unknown): value is AgoraJoinSuccessResponse {
  return (
    isRecord(value) &&
    typeof value.agent_id === "string" &&
    typeof value.create_ts === "number" &&
    typeof value.status === "string"
  );
}

function normalizeSessionId(value: string): string {
  return value.replaceAll("-", "").toLowerCase();
}

function isAgoraHexId(value: string): boolean {
  return value.length === AGORA_HEX_ID_LENGTH && /^[0-9a-fA-F]+$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
