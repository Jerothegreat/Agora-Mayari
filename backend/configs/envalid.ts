import dotenv from "dotenv";
import { cleanEnv, num, str } from "envalid";
import path from "path";

const envFile = process.env.ENV_FILE ?? path.join(process.cwd(), "../.env");
try {
  dotenv.config({ path: envFile });
} catch (e) {
  // Ignore dotenv read errors so validation can report missing variables clearly.
}

let validatedEnv;
try {
  validatedEnv = cleanEnv(process.env, {
    PORT: num({ default: 3000 }),
    DATABASE_URL: str(),
    ACCESS_TOKEN_SECRET: str(),
    REFRESH_TOKEN_SECRET: str(),
    GROQ_API_KEY: str(),
    GROQ_MODEL: str({ default: "llama-3.3-70b-versatile" }),
    LIVEKIT_URL: str({ default: "" }),
    LIVEKIT_API_KEY: str({ default: "" }),
    LIVEKIT_API_SECRET: str({ default: "" }),
    DEEPGRAM_API_KEY: str({ default: "" }),
    CARTESIA_API_KEY: str({ default: "" }),
    TTS_PROVIDER: str({ default: "cartesia" }),
    WEB_ORIGIN: str({ default: "http://localhost:5173" }),
  });
} catch (error) {
  console.error("Environment validation failed:", error);
  if (process.env.NODE_ENV === "production") {
    validatedEnv = process.env as any;
  } else {
    throw error;
  }
}

export const env = validatedEnv;
