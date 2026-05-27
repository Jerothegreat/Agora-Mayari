import express from "express";
import { getTriage, getHistory, getHealthSummary } from "../controllers/triageController.js";
import { startVoiceSession } from "../controllers/voiceSessionController.js";
import { 
  getDashboardSummary, 
  getRegionalStats, 
  getTrends, 
  getAlerts,
  generateIntelligence,
  getTopSymptoms,
  getAnomalySignals
} from "../controllers/healthIntelligenceController.js";

const router = express.Router();

router.post("/triage", getTriage);
router.post("/voice-sessions/start", startVoiceSession);
router.get("/triage/history", getHistory);
router.get("/triage/health-summary", getHealthSummary);
router.get("/dashboard/summary", getDashboardSummary);
router.get("/dashboard/regional", getRegionalStats);
router.get("/dashboard/trends", getTrends);
router.get("/dashboard/top-symptoms", getTopSymptoms);
router.get("/dashboard/anomalies", getAnomalySignals);
router.get("/alerts", getAlerts);
router.post("/intelligence/generate", generateIntelligence);

export default router;
