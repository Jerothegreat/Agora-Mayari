'use client';

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { Bot, Loader2, Mic, PhoneOff, RotateCcw, TrendingUp } from "lucide-react";
import BookingConfirmationCard from "@/components/BookingConfirmationCard";
import UrgencyBadge from "@/components/UrgencyBadge";
import {
  endVoiceSession,
  startVoiceSession,
  type EndVoiceSessionResponse,
  type StartVoiceSessionResponse,
} from "@/lib/api";
import { useVoiceSessionStore, type TranscriptTurn } from "@/stores/voiceSessionStore";

const decodeTranscriptPayload = (payload: Uint8Array) => {
  try {
    const message = JSON.parse(new TextDecoder().decode(payload)) as Partial<TranscriptTurn>;
    if (
      (message.role === "user" || message.role === "assistant") &&
      typeof message.text === "string"
    ) {
      return {
        role: message.role,
        text: message.text,
        timestamp: typeof message.timestamp === "number" ? message.timestamp : Date.now(),
      } satisfies TranscriptTurn;
    }
  } catch {
    return null;
  }

  return null;
};

export default function VoiceSession() {
  const {
    status,
    sessionId,
    agentId,
    channelName,
    token,
    uid,
    transcript,
    urgency,
    specialty,
    appointmentId,
    setSession,
    addTranscriptTurn,
    reset,
  } = useVoiceSessionStore();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const startSessionMutation = useMutation({
    mutationFn: startVoiceSession,
    onSuccess: async (result: { success: true; data: StartVoiceSessionResponse }) => {
      const payload = result.data;
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

      setSession({
        sessionId: payload.sessionId,
        agentId: payload.agentId,
        channelName: payload.channelName,
        token: payload.token,
        uid: payload.uid,
        status: "active",
      });

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      (client as unknown as {
        on: (event: "stream-message", handler: (remoteUid: number, payload: Uint8Array) => void) => void;
      }).on("stream-message", (_remoteUid, payload) => {
        const turn = decodeTranscriptPayload(payload);
        if (turn) {
          addTranscriptTurn(turn);
        }
      });

      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        payload.channelName,
        payload.token,
        Number(payload.uid),
      );

      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      await client.publish([micTrack]);
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: endVoiceSession,
    onSuccess: (result: { success: true; data: EndVoiceSessionResponse }) => {
      setSession({
        status: "ended",
        urgency: result.data.urgency,
        specialty: result.data.specialty,
        appointmentId: result.data.appointmentId,
      });
    },
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => {
      micTrackRef.current?.stop();
      micTrackRef.current?.close();
      clientRef.current?.leave().catch(() => undefined);
    };
  }, []);

  const handleStart = async () => {
    setSession({
      status: "connecting",
      transcript: [],
      urgency: null,
      specialty: null,
      appointmentId: null,
    });

    try {
      await startSessionMutation.mutateAsync();
    } catch {
      setSession({ status: "idle" });
    }
  };

  const handleEnd = async () => {
    micTrackRef.current?.stop();
    micTrackRef.current?.close();
    micTrackRef.current = null;

    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    if (!sessionId || !agentId || !channelName) {
      setSession({ status: "ended" });
      return;
    }

    await endSessionMutation.mutateAsync({
      sessionId,
      agentId,
      channelName,
      transcript,
      urgency,
      specialty,
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-teal-100 bg-white p-6 shadow-xl shadow-teal-100/40">
      {status === "idle" ? (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-600 p-3 text-white">
              <Bot size={26} />
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-700 border border-emerald-100">
              Always On
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">
              Your Clinic&apos;s Always-On Sales Agent
            </p>
            <h2 className="text-2xl font-black text-slate-900">Never miss a patient booking again.</h2>
            <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-slate-500">
              Kausapin si Mayari — mag-qualify ng leads, mag-handle ng objections, at mag-close ng booking sa Filipino o English. Kahit alas-nuwebe ng gabi.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="relative inline-flex items-center justify-center rounded-full bg-teal-600 px-8 py-8 text-white shadow-xl shadow-teal-200"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-50" />
            <span className="relative inline-flex items-center gap-3 text-base font-black">
              <Mic size={22} />
              Start Intake Call
            </span>
          </button>
          <p className="text-xs font-medium text-slate-400">Every call is a sales opportunity. Mayari qualifies and closes.</p>
        </div>
      ) : null}

      {status === "connecting" ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Loader2 className="animate-spin text-teal-600" size={36} />
          <p className="text-sm font-bold text-slate-600">Kinokonekta si Mayari...</p>
        </div>
      ) : null}

      {status === "active" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-3 text-red-500">
            <Mic className="animate-pulse" size={24} />
            <span className="text-sm font-black uppercase tracking-wider">Live session</span>
          </div>
          <div className="h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {transcript.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                Naghihintay ng transcript...
              </div>
            ) : (
              <div className="space-y-3">
                {transcript.map((turn, index) => (
                  <div
                    key={`${turn.timestamp}-${index}`}
                    className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={
                        turn.role === "user"
                          ? "max-w-[85%] rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
                          : "max-w-[85%] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                      }
                    >
                      {turn.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleEnd}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-4 text-sm font-black text-white transition-colors hover:bg-red-700"
          >
            <PhoneOff size={18} />
            Tapusin ang Tawag
          </button>
        </div>
      ) : null}

      {status === "ended" ? (
        <div className="space-y-5">
          <div className="space-y-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Resulta ng voice intake
            </p>
            {urgency ? <UrgencyBadge urgency={urgency} /> : null}
            {specialty ? (
              <p className="text-sm font-bold text-slate-600">Specialty: {specialty}</p>
            ) : null}
          </div>
          {(urgency === "low" || urgency === "medium") ? (
            <BookingConfirmationCard appointmentId={appointmentId} />
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RotateCcw size={18} />
            Magsimula ulit
          </button>
        </div>
      ) : null}

      {startSessionMutation.isError ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-black text-red-700">Voice session failed to start.</p>
          <p className="mt-1 text-xs font-medium text-red-500">
            {startSessionMutation.error instanceof Error
              ? startSessionMutation.error.message
              : "Hindi nagsimula ang voice session."}
          </p>
        </div>
      ) : null}
      {endSessionMutation.isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          Hindi natapos nang maayos ang voice session.
        </p>
      ) : null}
      {token && uid ? (
        <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
          Channel: {channelName} • UID: {uid}
        </p>
      ) : null}
    </div>
  );
}
