import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";

/**
 * Health check controller
 * @param req Request object
 * @param res Response with health status
 */
export const healthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check database connection
    let databaseStatus = "unknown";
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = "connected";
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      databaseStatus = "disconnected";
    }

    const healthData = {
      status: databaseStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      server: "Blood Bank Backend",
      version: "1.0.0",
      database: databaseStatus,
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
      endpoints: {
        auth: {
          donorLogin: "/donor-login",
          patientLogin: "/patient-login",
          adminLogin: "/admin-login",
          authStatus: "/auth/me",
        },
        data: {
          donors: "/donors",
          patients: "/patients",
          bloodBanks: "/blood-banks",
          bloodRequests: "/blood-requests",
        },
      },
    };

    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Environment status endpoint - returns information about environment configuration
 * @param req Request object
 * @param res Response object
 */
export const environmentStatus = (req: Request, res: Response): void => {
  // List of expected environment variables
  const expectedVars = ["DATABASE_URL", "JWT_SECRET", "PORT"];

  // Check which variables are configured
  const configuredVars = expectedVars.filter(
    (varName) => !!process.env[varName]
  );

  // Create masked version of environment for safety
  const maskedEnv = Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => expectedVars.includes(key))
      .map(([key, value]) => [key, value ? "configured" : "missing"])
  );

  res.status(200).json({
    success: true,
    data: {
      configured: configuredVars.length === expectedVars.length,
      configuredCount: configuredVars.length,
      expectedCount: expectedVars.length,
      environment: process.env.NODE_ENV || "development",
      variables: maskedEnv,
    },
  });
};
