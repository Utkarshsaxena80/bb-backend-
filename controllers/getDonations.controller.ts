import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const getDonation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. User ID missing.",
        success: false,
      });
    }

    // Get all donation requests for this blood bank
    const donationRequests = await prisma.donationRequest.findMany({
      where: {
        bloodBankId: bloodBankUserId,
      },
      orderBy: {
        createdAt: "desc", // Most recent first
      },
    });

    // Check if any requests found
    if (!donationRequests || donationRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No donation requests found for this blood bank.",
        data: [],
        count: 0,
      });
    }

    // Success response with all donation requests
    return res.status(200).json({
      success: true,
      message: "Donation requests retrieved successfully.",
      data: donationRequests,
      count: donationRequests.length,
      summary: {
        pending: donationRequests.filter((req) => req.status === "pending")
          .length,
        success: donationRequests.filter((req) => req.status === "success")
          .length,
        approved: donationRequests.filter((req) => req.status === "approved")
          .length,
        completed: donationRequests.filter((req) => req.status === "completed")
          .length,
        cancelled: donationRequests.filter((req) => req.status === "cancelled")
          .length,
        rejected: donationRequests.filter((req) => req.status === "rejected")
          .length,
      },
    });
  } catch (error) {
    console.error("Error in getDonation handler:", error);

    if (typeof error === "object" && error !== null && "code" in error) {
      const err = error as { code?: string };

      if (err.code === "P2025") {
        return res.status(404).json({
          error: "Blood bank not found.",
          success: false,
        });
      }
    }

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

export { getDonation };
