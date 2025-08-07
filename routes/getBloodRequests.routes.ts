import express from "express";
import { authMiddleware } from "../middlewares/token.middleware.ts";
import { getApprovedDonationRequests } from "../controllers/getBloodRequests.controllers.ts";

const getBloodRequests = express.Router();

getBloodRequests.get("/getBloodRequests", authMiddleware, getApprovedDonationRequests);
export default getBloodRequests;
