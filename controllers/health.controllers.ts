import { Request, Response } from "express";

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
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      server: "Blood Bank Backend",
      version: "1.0.0",
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
          donorLogin: "/donor/login",
          patientLogin: "/patient/login",
          adminLogin: "/admin/login",
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
