import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";

// This interface assumes you have middleware that attaches the user's ID to the request object.
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

/**
 * Fetches all donation requests with an "approved" status for the authenticated blood bank.
 * @param {AuthenticatedRequest} req - The Express request object, containing the user's ID.
 * @param {Response} res - The Express response object.
 */
const getApprovedDonationRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Extract the blood bank's user ID from the authenticated request.
    const bloodBankUserId = req.user?.userId;

    // 2. Ensure the user is authenticated.
    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. User ID is missing.",
        success: false,
      });
    }

    // 3. Fetch only the approved donation requests for this specific blood bank.
    const approvedRequests = await prisma.donationRequest.findMany({
      where: {
        bloodBankId: bloodBankUserId, // Filter by the blood bank's ID.
        status: "approved",         // **Only include requests with 'approved' status.**
      },
      orderBy: {
        createdAt: "desc", // Show the most recent requests first.
      },
    });

    // 4. Handle the case where no approved requests are found.
    if (!approvedRequests || approvedRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No approved donation requests found for this blood bank.",
        data: [],
      });
    }

    // 5. Return the found requests successfully.
    return res.status(200).json({
      success: true,
      message: "Approved donation requests retrieved successfully.",
      data: approvedRequests,
      count: approvedRequests.length,
    });

  } catch (error) {
    // 6. Handle potential server or database errors.
    console.error("Error in getApprovedDonationRequests handler:", error);
    
    // Provide a generic error message to the client.
    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

export { getApprovedDonationRequests };
