import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateToken } from "../utils/jwt.utils.ts";

const bloodBankSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  adminName: z.string().min(2, "Admin name is too short"),
  licenseNumber: z.string().min(2, "License number is too short"),
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  totalBloodBags: z
    .number()
    .int("Must be a whole number")
    .nonnegative("Must be 0 or greater"),
  address: z.string().min(4, "Address is too short"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

/**
 *
 * @param req the data of patient
 * @param res will give the response of operations
 */

const bloodR = async (req: Request, res: Response): Promise<void> => {
  console.log("Blood Bank Registration Request:", req.body);
  const bloodBankData = bloodBankSchema.parse(req.body);
  try {
    const userExists = await prisma.bloodBanks.findFirst({
      where: {
        OR: [{ email: bloodBankData.email }, { phone: bloodBankData.phone }],
      },
    });
    if (userExists) {
      console.error("Registration failed: User already exists", {
        email: bloodBankData.email,
        phone: bloodBankData.phone,
        existingEmail: userExists.email,
      });
      res.status(409).json({
        message:
          userExists.email === bloodBankData.email
            ? "User already exists with this email"
            : "User already exists with this phone number",
      });
    } else {
      //heash password

      const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10");

      const hashedPassword = await bcrypt.hash(
        bloodBankData.password,
        SALT_ROUNDS
      );

      const pushBloodBank = await prisma.bloodBanks.create({
        data: {
          name: bloodBankData.name,
          adminName: bloodBankData.adminName,
          licenseNumber: bloodBankData.licenseNumber,
          email: bloodBankData.email,
          password: hashedPassword,
          phone: bloodBankData.phone,
          totalBloodBags: 0,
          address: bloodBankData.address,
          city: bloodBankData.city,
          state: bloodBankData.state,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      //creating jwt token
      const token = generateToken(pushBloodBank.id);

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "User added successfully",
        data: {
          id: pushBloodBank.id,
          name: pushBloodBank.name,
          email: pushBloodBank.email,
          createdAt: pushBloodBank.createdAt,
        },
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        message: "invalid input data",
      });
      return;
    }
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
      return;
    }
    console.error("donor registration error", err);

    res.status(500).json({
      message: "Cannot register at this moment",
    });
  }
};
export { bloodR };
