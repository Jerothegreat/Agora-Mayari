import express, { type Router } from "express";
import {
  createPatient,
  getAllPatients,
  getMyPatientProfile,
  getPatient,
  updateMyPatientProfile,
  updatePatient,
} from "../controllers/patientControllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router: Router = express.Router();

router.get("/me", verifyJWT, getMyPatientProfile);
router.patch("/me", verifyJWT, updateMyPatientProfile);
router
  .get("/", getAllPatients)
  .get("/:id", getPatient)
  .post("/create", createPatient)
  .patch("/update/:id", updatePatient);

export default router;
