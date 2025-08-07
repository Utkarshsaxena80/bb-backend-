import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import { verifyToken } from "../utils/jwt.utils.ts";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

/**
 * Verify current user authentication and return user data
 * @param req Authenticated request with user ID
 * @param res Response with current user data
 */
export const verifyAuth = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies?.authToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No authentication token found",
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token) as { userId: string };
    const userId = decoded.userId;

    // Try to find user in all three tables
    let user = null;
    let role = "";

    // Check donors table
    const donor = await prisma.donors.findFirst({
      where: { id: userId },
    });

    if (donor) {
      user = {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodType: donor.BloodType,
        city: donor.city,
        state: donor.state,
        bloodBank: donor.BloodBank,
      };
      role = "donor";
    } else {
      // Check patients table
      const patient = await prisma.patients.findFirst({
        where: { id: userId },
      });

      if (patient) {
        user = {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          bloodType: patient.BloodType,
          city: patient.city,
          state: patient.state,
          bloodBank: patient.BloodBank,
        };
        role = "patient";
      } else {
        // Check blood banks table
        const admin = await prisma.bloodBanks.findFirst({
          where: { id: userId },
        });

        if (admin) {
          user = {
            id: admin.id,
            name: admin.adminName,
            email: admin.email,
            phone: admin.phone,
            bloodBankName: admin.name,
            licenseNumber: admin.licenseNumber,
            address: admin.address,
            city: admin.city,
            state: admin.state,
            totalBloodBags: admin.totalBloodBags,
          };
          role = "admin";
        }
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        role,
      },
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Logout controller - clears the auth cookie
 * @param req Request
 * @param res Response
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the auth cookie
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
