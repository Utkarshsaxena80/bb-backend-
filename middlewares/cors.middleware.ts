import { Request, Response, NextFunction } from "express";
import { corsConfig, isOriginAllowed } from "../config/cors.config.ts";

/**
 * Enhanced CORS middleware for additional header management
 * This middleware ensures proper CORS headers are set for all responses
 */
export const corsEnhancementMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const origin = req.headers.origin as string;

  // Set origin if it's in allowed list
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Set additional CORS headers for enhanced compatibility
  res.setHeader(
    "Access-Control-Allow-Credentials",
    corsConfig.credentials.toString()
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    corsConfig.allowedMethods.join(", ")
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    corsConfig.allowedHeaders.join(", ")
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    corsConfig.exposedHeaders.join(", ")
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Max-Age", corsConfig.maxAge.toString());
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  next();
};
