import { create } from "zustand";

export type TranscriptTurn = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

export interface VoiceSessionState {
  status: "idle" | "connecting" | "active" | "ended";
  sessionId: string | null;
  agentId: string | null;
  channelName: string | null;
  token: string | null;
  uid: string | null;
  transcript: TranscriptTurn[];
  urgency: "low" | "medium" | "high" | null;
  specialty: string | null;
  appointmentId: string | null;
  setSession: (data: Partial<VoiceSessionState>) => void;
  addTranscriptTurn: (turn: TranscriptTurn) => void;
  reset: () => void;
}

const initialState: Omit<
  VoiceSessionState,
  "setSession" | "addTranscriptTurn" | "reset"
> = {
  status: "idle",
  sessionId: null,
  agentId: null,
  channelName: null,
  token: null,
  uid: null,
  transcript: [],
  urgency: null,
  specialty: null,
  appointmentId: null,
};

export const useVoiceSessionStore = create<VoiceSessionState>((set) => ({
  ...initialState,
  setSession: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),
  addTranscriptTurn: (turn) =>
    set((state) => ({
      transcript: [...state.transcript, turn],
    })),
  reset: () => set(initialState),
}));
