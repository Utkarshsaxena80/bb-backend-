import express from "express";
import type { Router } from "express";
import { patientR } from "../controllers/patientRegis.controllers.ts";

const patientRegsitration: express.Router = express.Router();

patientRegsitration.post("/register-patient", patientR);

export default patientRegsitration;
