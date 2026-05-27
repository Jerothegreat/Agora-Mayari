import dotenv from "dotenv";
import { cleanEnv, num, str } from "envalid";
import path from "path";

const envFile = process.env.ENV_FILE ?? path.join(process.cwd(), "../.env");
try {
  dotenv.config({ path: envFile });
} catch (e) {
  // Ignore error if .env is missing in production
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
    WEB_ORIGINS: str({
      default: "http://localhost:5173,http://localhost:3000",
    }),
  });
} catch (error) {
  console.error("Environment validation failed:", error);
  // On Vercel, we want to avoid crashing at module load time so the handler can catch the error later
  if (process.env.NODE_ENV === "production") {
    validatedEnv = process.env as any;
  } else {
    throw error;
  }
}

export const env = validatedEnv;
