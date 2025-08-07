import { Router } from "express";
import { donorLogin } from "../controllers/donorLogin.controllers.ts";

const router = Router();

// Donor login route
router.post("/donor-login", donorLogin);

export default router;
