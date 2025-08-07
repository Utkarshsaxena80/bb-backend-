import express from "express";
import { donate1 } from "../controllers/donate.controllers.ts";
const donate = express.Router();
import { authMiddleware } from "../middlewares/token.middleware.ts";
// Pass the required arguments to authMiddleware, for example, if it expects no arguments, remove the parentheses
donate.post("/donate", authMiddleware, donate1);

export default donate;
