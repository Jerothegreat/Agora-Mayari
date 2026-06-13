import { type CorsOptions } from "cors";
import { env } from "./envalid.js";

const allowedOrigins = env.WEB_ORIGIN.split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
