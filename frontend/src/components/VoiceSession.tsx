'use client';

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Room, RoomEvent, type Participant, type TranscriptionSegment } from "livekit-client";
import { Bot, Loader2, Mic, PhoneOff, RotateCcw } from "lucide-react";
import BookingConfirmationCard from "@/components/BookingConfirmationCard";
import UrgencyBadge from "@/components/UrgencyBadge";
import {
  endVoiceSession,
  startVoiceSession,
  type EndVoiceSessionResponse,
  type StartVoiceSessionResponse,
} from "@/lib/api";
import { useVoiceSessionStore, type TranscriptTurn } from "@/stores/voiceSessionStore";

export default function VoiceSession() {
  const {
    status,
    sessionId,
    roomName,
    token,
    url,
    transcript,
    urgency,
    specialty,
    appointmentId,
    setSession,
    addTranscriptTurn,
    reset,
  } = useVoiceSessionStore();

  const roomRef = useRef<Room | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const startSessionMutation = useMutation({
    mutationFn: startVoiceSession,
    onSuccess: async (result: { success: true; data: StartVoiceSessionResponse }) => {
      const { token: roomToken, roomName: rName, sessionId: sid, url: livekitUrl } = result.data;

      setSession({ sessionId: sid, roomName: rName, token: roomToken, url: livekitUrl, status: "connecting" });

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TranscriptionReceived, (
        segments: TranscriptionSegment[],
        participant?: Participant,
      ) => {
        for (const seg of segments) {
          if (!seg.final) continue;
          const isAgent = !!participant;
          const turn: TranscriptTurn = {
            role: isAgent ? "assistant" : "user",
            text: seg.text.trim(),
            timestamp: Date.now(),
          };
          if (turn.text) addTranscriptTurn(turn);
        }
      });

      room.on(RoomEvent.Connected, () => {
        setSession({ status: "active" });
      });

      room.on(RoomEvent.Disconnected, () => {
        if (useVoiceSessionStore.getState().status === "active") {
          setSession({ status: "ended" });
        }
      });

      await room.connect(livekitUrl, roomToken);
      await room.localParticipant.setMicrophoneEnabled(true);
    },
    onError: () => {
      setSession({ status: "idle" });
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
      roomRef.current?.disconnect();
    };
  }, []);

  const handleStart = () => {
    setSession({ status: "connecting", transcript: [], urgency: null, specialty: null, appointmentId: null });
    startSessionMutation.mutate();
  };

  const handleEnd = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    const store = useVoiceSessionStore.getState();
    if (!store.sessionId || !store.roomName) {
      setSession({ status: "ended" });
      return;
    }

    endSessionMutation.mutate({
      sessionId: store.sessionId,
      roomName: store.roomName,
      transcript: store.transcript,
      urgency: store.urgency,
      specialty: store.specialty,
    });
  };

  const isActive = status === "active";

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden rounded-[2rem] border border-emerald-200/40 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-900 text-white shadow-2xl shadow-teal-950/20 transition-all duration-500 ${
        isActive ? "max-w-4xl" : "max-w-2xl"
      }`}
    >
      <span className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-emerald-400/10" />

      <div className={`flex ${isActive ? "flex-col md:flex-row" : "flex-col"}`}>
        {/* ── Left / Main panel ── */}
        <div
          className={`flex flex-col p-8 ${
            isActive ? "md:w-72 md:shrink-0 md:border-r md:border-white/10" : "w-full"
          }`}
        >
          {status === "idle" && (
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                  <Bot size={26} />
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-100">
                  Always On
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  Your Clinic&apos;s Always-On Sales Agent
                </p>
                <h2 className="text-2xl font-black tracking-tight">Never miss a patient booking again.</h2>
                <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-emerald-50/75">
                  Kausapin si Mayari — mag-qualify ng leads, mag-handle ng objections, at mag-close ng booking sa Filipino o English. Kahit alas-nuwebe ng gabi.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="relative inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-8 font-black text-emerald-950 shadow-xl shadow-emerald-950/40 transition hover:bg-emerald-300"
              >
                {startSessionMutation.isPending && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
                )}
                <span className="relative inline-flex items-center gap-3 text-base">
                  <Mic size={22} />
                  Start Intake Call
                </span>
              </button>
              <p className="text-xs font-medium text-emerald-50/50">Every call is a sales opportunity. Mayari qualifies and closes.</p>

              {startSessionMutation.isError && (
                <div className="w-full rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-left">
                  <p className="text-sm font-black text-rose-100">Voice session failed to start.</p>
                  <p className="mt-1 text-xs font-medium text-rose-200/70">
                    {startSessionMutation.error instanceof Error
                      ? startSessionMutation.error.message
                      : "Hindi nagsimula ang voice session."}
                  </p>
                </div>
              )}
            </div>
          )}

          {status === "connecting" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Loader2 className="animate-spin text-emerald-300" size={36} />
              <p className="text-sm font-bold text-emerald-100">Kinokonekta si Mayari...</p>
            </div>
          )}

          {status === "active" && (
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              <div className="flex items-center gap-2 text-emerald-300">
                <Mic className="animate-pulse" size={20} />
                <span className="text-xs font-black uppercase tracking-wider">Live</span>
              </div>
              <div className="rounded-2xl bg-emerald-400/15 p-5 text-emerald-300">
                <Bot size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-white">Mayari is listening</p>
                <p className="text-xs text-emerald-50/60">Speak naturally about your symptoms</p>
              </div>
              {roomName && (
                <p className="text-[10px] text-emerald-50/25 truncate max-w-full px-2">{roomName}</p>
              )}
              <button
                type="button"
                onClick={handleEnd}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-rose-400"
              >
                <PhoneOff size={16} />
                Tapusin ang Tawag
              </button>
              {endSessionMutation.isError && (
                <p className="text-xs font-semibold text-rose-300">Hindi natapos nang maayos.</p>
              )}
            </div>
          )}

          {status === "ended" && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  Resulta ng voice intake
                </p>
                {urgency ? <UrgencyBadge urgency={urgency} /> : null}
                {specialty ? (
                  <p className="text-sm font-bold text-emerald-100">Specialty: {specialty}</p>
                ) : null}
              </div>
              {(urgency === "low" || urgency === "medium") ? (
                <BookingConfirmationCard appointmentId={appointmentId} />
              ) : null}
              <button
                type="button"
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-black text-white transition-colors hover:bg-white/15"
              >
                <RotateCcw size={16} />
                Magsimula ulit
              </button>
            </div>
          )}
        </div>

        {/* ── Right / Transcript panel — only when active or ended ── */}
        {(status === "active" || status === "ended") && (
          <div className="flex flex-1 flex-col p-6 md:p-8">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Conversation
            </p>
            <div
              className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur"
              style={{ minHeight: "20rem", maxHeight: "28rem" }}
            >
              {transcript.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm font-medium text-emerald-50/30">
                  {status === "active" ? "Naghihintay ng transcript..." : "Walang transcript."}
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((turn, index) => (
                    <div
                      key={`${turn.timestamp}-${index}`}
                      className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                      <div className="flex flex-col gap-1 max-w-[85%]">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            turn.role === "user"
                              ? "text-right text-emerald-300"
                              : "text-left text-white/40"
                          }`}
                        >
                          {turn.role === "user" ? "You" : "Mayari"}
                        </span>
                        <div
                          className={
                            turn.role === "user"
                              ? "rounded-2xl rounded-br-sm bg-emerald-400 px-4 py-2.5 text-sm font-medium text-emerald-950"
                              : "rounded-2xl rounded-bl-sm border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white"
                          }
                        >
                          {turn.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
