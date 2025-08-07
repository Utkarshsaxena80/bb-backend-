import { Router } from "express";
import { adminLogin } from "../controllers/adminLogin.controllers.ts";

const router = Router();

// Admin login route
router.post("/admin-login", adminLogin);

export default router;
