import { Router } from "express";
import { healthCheck } from "../controllers/health.controllers.ts";

const router = Router();

// Health check endpoint
router.get("/health", healthCheck);
router.get("/", healthCheck); // Root endpoint also returns health info

export default router;
