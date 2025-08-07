/**
 * CORS Configuration
 * Centralized configuration for Cross-Origin Resource Sharing
 */

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * Get allowed origins from environment and defaults
 */
export const getAllowedOrigins = (): string[] => {
  const defaultOrigins = [
    "http://localhost:3000", // Local development frontend
    "http://localhost:3001", // Alternative local development port
    "https://bb-frontend-seven.vercel.app", // Production frontend
    "https://bloodbank-frontend.vercel.app", // Alternative production domain
  ];

  // Add environment variable support for additional origins
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS
    ? process.env.ADDITIONAL_CORS_ORIGINS.split(",").map((origin) =>
        origin.trim()
      )
    : [];

  return [...defaultOrigins, ...additionalOrigins];
};

/**
 * Default CORS configuration
 */
export const corsConfig: CorsConfig = {
  allowedOrigins: getAllowedOrigins(),
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["Content-Length", "Content-Range", "Set-Cookie"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl, etc.)
  return corsConfig.allowedOrigins.includes(origin);
};

/**
 * Log CORS configuration on startup
 */
export const logCorsConfig = (): void => {
  console.log("🔒 CORS Configuration:");
  console.log("  📍 Allowed Origins:", corsConfig.allowedOrigins);
  console.log("  🔧 Allowed Methods:", corsConfig.allowedMethods.join(", "));
  console.log("  🍪 Credentials Enabled:", corsConfig.credentials);
  console.log("  ⏰ Max Age:", corsConfig.maxAge, "seconds");
};
