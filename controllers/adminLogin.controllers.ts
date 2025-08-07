import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateToken } from "../utils/jwt.utils.ts";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Blood Bank Admin login controller
 * @param req Request containing email and password
 * @param res Response with user data and auth token
 */
export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const loginData = adminLoginSchema.parse(req.body);

    // Find blood bank admin by email
    const admin = await prisma.bloodBanks.findFirst({
      where: {
        email: loginData.email,
      },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      admin.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(admin.id);

    // Set HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (without password)
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
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
        role: "admin",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: err.issues,
      });
      return;
    }

    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
