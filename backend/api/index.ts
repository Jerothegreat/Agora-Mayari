import type { Request, Response } from "express";
import app from "../app.js";
import { connectDB } from "../configs/db.js";

let databaseReady: Promise<void> | null = null;

const ensureDatabaseConnection = () => {
  if (!databaseReady) {
    databaseReady = connectDB().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }

  return databaseReady;
};

export default async function handler(req: Request, res: Response) {
  await ensureDatabaseConnection();
  return app(req, res);
}
