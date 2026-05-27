import express from "express";
import {
  createFacility,
  getAllFacilities,
  getMyFacilityProfile,
  getFacility,
  updateMyFacilityProfile,
  updateFacility,
} from "../controllers/facilityControllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();

router.get("/me", verifyJWT, getMyFacilityProfile);
router.patch("/me", verifyJWT, updateMyFacilityProfile);
router
  .get("/", getAllFacilities)
  .get("/:id", getFacility)
  .post("/create", createFacility)
  .patch("/update/:id", updateFacility);

export default router;
