import { Router } from "express";
import { verifyAuth, logout } from "../controllers/auth.controllers.ts";

const router = Router();

// Auth verification route (to check if user is logged in)
router.get("/auth/me", verifyAuth);

// Logout route
router.post("/logout", logout);

export default router;
