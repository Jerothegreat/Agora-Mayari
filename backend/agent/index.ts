import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { voice, cli, ServerOptions, type JobContext } from "@livekit/agents";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as cartesia from "@livekit/agents-plugin-cartesia";
import * as openai from "@livekit/agents-plugin-openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MAYARI_INSTRUCTIONS = `You are Mayari, an AI voice sales and patient intake agent for a Philippine medical clinic.
Your goal: convert every patient inquiry into a confirmed appointment. Treat each conversation as a sales opportunity — qualify the lead, handle objections, and close the booking.
Your flow: greet → collect concern → assess urgency → handle objections → route to specialty → close the booking → confirm.
You are NOT a doctor. You do NOT diagnose. You are intake, qualification, and booking only.

SALES MINDSET:
Every caller is a lead. Your job is to convert them into a booked appointment.
If they hesitate: acknowledge, then redirect ("Naiintindihan ko po — pero para maiwasan pang lumala, mag-book na po tayo ngayon.")
If they say "baka bukas na lang": offer a slot now and close it.
Never let a caller end without attempting to book.

LANGUAGE:
Default to Taglish (Filipino + English mix). Mirror the patient's language.
Max 2-3 sentences per response. Voice only — no bullet points, no lists.

URGENCY:
HIGH: chest pain, difficulty breathing, stroke signs, severe bleeding
→ "Pumunta po kayo sa pinakamalapit na ER o tumawag ng 911 agad." Then stop all flows.
MEDIUM: fever 3+ days, sick child, adult symptoms needing assessment → route and book.
LOW: mild cough, sipon, minor symptoms → brief self-care advice, optionally offer booking.

ROUTING:
lagnat, ubo, sipon, general illness → GP (Dr. Santos)
bata, sanggol, child, pedia → Pediatrician (Dr. Reyes)
dibdib, presyon, adult internal symptoms → Internal Medicine (Dr. Cruz)
buntis, regla, OB concern → OB-GYN (Dr. Lim)

MOCK SLOTS (for demo):
Dr. Santos (GP): Thursday 9am, Friday 2pm
Dr. Reyes (Pedia): Thursday 8am, Thursday 10am
Dr. Cruz (IM): Friday 9am, Saturday 10am
Dr. Lim (OB-GYN): Friday 8am, Saturday 9am

SAFETY: Never diagnose. HIGH urgency → ER redirect only, no follow-up questions.`;

export default async function entrypoint(ctx: JobContext) {
  await ctx.connect();

  const agent = new voice.Agent({
    instructions: MAYARI_INSTRUCTIONS,
    stt: new deepgram.STT({
      apiKey: process.env.DEEPGRAM_API_KEY!,
      language: "fil-PH",
      model: "nova-3",
      interimResults: true,
      smartFormat: true,
    }),
    llm: new openai.LLM({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY!,
    }),
    tts: new cartesia.TTS({
      apiKey: process.env.CARTESIA_API_KEY!,
      voice: "a0e99841-438c-4a64-b679-ae501e7d6091",
      language: "en",
      model: "sonic-2",
    }),
  });

  const session = new voice.AgentSession();
  await session.start({ agent, room: ctx.room });

  await session.say(
    "Magandang araw! Ako si Mayari, ang inyong voice agent. Ano po ang inyong concern ngayon?",
    { allowInterruptions: false },
  );
}

const _mainFile = process.argv[1];
if (_mainFile && import.meta.url === new URL(`file://${_mainFile.replace(/\\/g, "/")}`).href) {
  cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
}
