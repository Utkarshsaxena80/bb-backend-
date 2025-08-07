import express from "express";
import { authMiddleware } from "../middlewares/token.middleware.ts";
import { getDonation } from "../controllers/getDonations.controller.ts";
const getDonations = express.Router();

getDonations.get("/getDonations", authMiddleware, getDonation);
export default getDonations;
