'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Phone, PhoneOff, ShieldAlert, Waves } from 'lucide-react';
import { startVoiceSession } from '@/lib/api';

type AgoraClient = {
  on: (
    event: 'user-published' | 'user-unpublished',
    listener: (user: AgoraRemoteUser, mediaType: 'audio' | 'video') => void,
  ) => void;
  join: (appId: string, channel: string, token: string, uid: string | null) => Promise<unknown>;
  publish: (tracks: unknown) => Promise<void>;
  subscribe: (user: AgoraRemoteUser, mediaType: 'audio' | 'video') => Promise<void>;
  leave: () => Promise<void>;
  removeAllListeners: () => void;
};

type AgoraLocalAudioTrack = {
  setEnabled: (enabled: boolean) => Promise<void>;
  close: () => void;
};

type AgoraRemoteUser = {
  audioTrack?: {
    play: () => void;
    stop: () => void;
  };
};

const loadAgoraRtc = async () => {
  const agoraModule = await import('agora-rtc-sdk-ng');
  return agoraModule.default;
};

export default function VoiceTriagePanel() {
  const clientRef = useRef<AgoraClient | null>(null);
  const localTrackRef = useRef<AgoraLocalAudioTrack | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Talk to the Agora-powered Haliya voice triage agent.');
  const [error, setError] = useState<string | null>(null);

  const teardown = async () => {
    const localTrack = localTrackRef.current;
    const client = clientRef.current;

    localTrackRef.current = null;
    clientRef.current = null;
    setIsConnected(false);
    setIsMuted(false);

    try {
      if (localTrack) {
        localTrack.close();
      }
      if (client) {
        client.removeAllListeners();
        await client.leave();
      }
    } catch {
      // Best-effort cleanup only.
    }
  };

  useEffect(() => {
    return () => {
      void teardown();
    };
  }, []);

  const handleStart = async () => {
    setIsConnecting(true);
    setError(null);
    setStatus('Starting secure voice session...');

    try {
      const AgoraRTC = await loadAgoraRtc();
      const session = await startVoiceSession();
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as unknown as AgoraClient;
      const localTrack = await AgoraRTC.createMicrophoneAudioTrack() as unknown as AgoraLocalAudioTrack;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setStatus('Voice agent connected. Speak naturally about your symptoms.');
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          user.audioTrack?.stop();
        }
      });

      await client.join(
        session.session.app_id,
        session.session.channel,
        session.session.client.rtc_token,
        session.session.client.rtc_uid,
      );
      await client.publish([localTrack]);

      clientRef.current = client;
      localTrackRef.current = localTrack;
      setIsConnected(true);
      setStatus('Connected. The agent can now hear you.');
    } catch (err: unknown) {
      await teardown();
      setError(err instanceof Error ? err.message : 'Failed to start voice triage.');
      setStatus('Voice triage unavailable.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEnd = async () => {
    setStatus('Voice session ended.');
    setError(null);
    await teardown();
  };

  const handleMuteToggle = async () => {
    const localTrack = localTrackRef.current;
    if (!localTrack) {
      return;
    }

    const nextMuted = !isMuted;
    await localTrack.setEnabled(!nextMuted);
    setIsMuted(nextMuted);
    setStatus(nextMuted ? 'Microphone muted.' : 'Microphone live.');
  };

  return (
    <section className="mb-10 overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-900 p-8 text-white shadow-2xl shadow-teal-950/20">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">
            <Waves size={14} />
            Voice Triage
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Speak to the Agora Haliya agent
            </h2>
            <p className="max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
              Use voice when typing is slow or difficult. The agent joins a live Agora session and listens through your microphone for a spoken triage intake.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-emerald-50/85">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">Live microphone</span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">Agora agent pipeline</span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">No credentials exposed client-side</span>
          </div>
        </div>

        <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-6 backdrop-blur">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
              {error ? <ShieldAlert size={22} /> : <Mic size={22} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-100">Session status</p>
              <p className="mt-1 text-sm leading-6 text-emerald-50/75">{status}</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
              >
                <Phone size={18} />
                {isConnecting ? 'Connecting...' : 'Start Voice Triage'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  <Mic size={18} />
                  {isMuted ? 'Unmute Mic' : 'Mute Mic'}
                </button>
                <button
                  type="button"
                  onClick={handleEnd}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 font-bold text-white transition hover:bg-rose-400"
                >
                  <PhoneOff size={18} />
                  End Session
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
