import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.utils.ts";
interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ error: "Authentication token missing" });
    }
    const decoded = verifyToken(token) as { userId: string };

    req.user = { userId: decoded.userId };
    console.log(decoded.userId);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
