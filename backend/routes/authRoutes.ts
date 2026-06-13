import express, { type Router } from "express";
import { 
  login, 
  registerPatient, 
  registerFacility, 
  refresh, 
  logout,
  deleteMyAccount
} from "../controllers/authControllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router: Router = express.Router();

router.post("/login", login);
router.post("/register/patient", registerPatient);
router.post("/register/facility", registerFacility);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.delete("/me", verifyJWT, deleteMyAccount);

export default router;
