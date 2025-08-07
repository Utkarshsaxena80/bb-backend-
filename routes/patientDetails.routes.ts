import express from "express";
import { getAllPatients } from "../controllers/patientDetail.controllers.ts";
const patientDetail: express.Router = express.Router();

patientDetail.get("/patientDetail", getAllPatients);
export default patientDetail;
