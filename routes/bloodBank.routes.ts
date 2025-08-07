import express from "express";

const bloodBank = express.Router();
import { bloodR } from "../controllers/bloodBankRegistration.controllers.ts";
bloodBank.post("/register-bloodBank", bloodR);

export default bloodBank;
