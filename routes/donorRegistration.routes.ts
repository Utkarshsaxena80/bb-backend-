import express from "express";
import { donorR } from "../controllers/donorR.controllers.ts";

const donorRegistration: express.Router = express.Router();

donorRegistration.post("/donor-registration", donorR);

export default donorRegistration;
