import { Router } from "express";
import { patientLogin } from "../controllers/patientLogin.controllers.ts";

const router = Router();

// Patient login route
router.post("/patient-login", patientLogin);

export default router;
