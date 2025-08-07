import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateToken } from "../utils/jwt.utils.ts";

const patientLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Patient login controller
 * @param req Request containing email and password
 * @param res Response with user data and auth token
 */
export const patientLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const loginData = patientLoginSchema.parse(req.body);

    // Find patient by email
    const patient = await prisma.patients.findFirst({
      where: {
        email: loginData.email,
      },
    });

    if (!patient) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      patient.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(patient.id);

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
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        bloodType: patient.BloodType,
        city: patient.city,
        state: patient.state,
        bloodBank: patient.BloodBank,
        role: "patient",
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

    console.error("Patient login error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
