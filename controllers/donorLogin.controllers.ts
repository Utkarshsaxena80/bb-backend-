import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateToken } from "../utils/jwt.utils.ts";

const donorLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Donor login controller
 * @param req Request containing email and password
 * @param res Response with user data and auth token
 */
export const donorLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const loginData = donorLoginSchema.parse(req.body);

    // Find donor by email
    const donor = await prisma.donors.findFirst({
      where: {
        email: loginData.email,
      },
    });

    if (!donor) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      donor.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(donor.id);

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
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodType: donor.BloodType,
        city: donor.city,
        state: donor.state,
        bloodBank: donor.BloodBank,
        role: "donor",
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

    console.error("Donor login error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
