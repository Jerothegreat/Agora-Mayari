import type { Request, Response } from "express";
import { createVoiceSession, VoiceSessionError } from "../services/voiceSessionService.js";

export const startVoiceSession = async (req: Request, res: Response) => {
  try {
    const session = await createVoiceSession({
      name: typeof req.body?.name === "string" ? req.body.name : undefined,
      channel: typeof req.body?.channel === "string" ? req.body.channel : undefined,
      enable_string_uid:
        typeof req.body?.enable_string_uid === "boolean" ? req.body.enable_string_uid : true,
      idle_timeout: typeof req.body?.idle_timeout === "number" ? req.body.idle_timeout : undefined,
      token_expiration_seconds:
        typeof req.body?.token_expiration_seconds === "number"
          ? req.body.token_expiration_seconds
          : undefined,
    });

    return res.json({
      success: true,
      status: "voice_session_started",
      session: {
        session_id: session.sessionId,
        app_id: session.appId,
        channel: session.channel,
        client: {
          rtc_uid: session.client.rtcUid,
          rtc_token: session.client.rtcToken,
        },
        agent: {
          rtc_uid: session.agent.rtcUid,
          agent_id: session.agent.agentId,
          create_ts: session.agent.createTs,
          status: session.agent.status,
        },
      },
    });
  } catch (error) {
    if (error instanceof VoiceSessionError) {
      return res.status(error.statusCode).json({
        success: false,
        message: "Failed to start voice session",
        code: error.code,
        details: error.details,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unexpected voice session error",
    });
  }
};
