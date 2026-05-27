import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointment,
  getMyAppointments,
  getFacilities,
  updateStatus,
  submitTriageFeedback,
  getFeedbackMetrics
} from "../controllers/appointmentControllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getAllAppointments);
router.get("/my-appointments", getMyAppointments);
router.get("/facilities", getFacilities);
router.get("/feedback/metrics", getFeedbackMetrics);
router.get("/:id", getAppointment);
router.post("/", createAppointment);
router.patch("/:id/status", updateStatus);
router.patch("/:id/feedback", submitTriageFeedback);

export default router;
