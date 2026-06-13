import express, { type Router } from "express";
import {
  createConsultation,
  getAllConsultations,
  getConsultation,
  updateConsultation,
} from "../controllers/consultationControllers.js";

const router: Router = express.Router();

// router.use(verifyJWT);
router
  .get("/", getAllConsultations)
  .get("/:id", getConsultation)
  .post("/create", createConsultation)
  .patch("/update/:id", updateConsultation);

export default router;
