import { Router } from "express";
import {
  healthCheck,
  environmentStatus,
} from "../controllers/health.controllers.ts";

const router = Router();

// Health check endpoint
router.get("/health", healthCheck);
router.get("/", healthCheck); // Root endpoint also returns health info

// Environment status endpoint
router.get("/env-status", environmentStatus);

export default router;
