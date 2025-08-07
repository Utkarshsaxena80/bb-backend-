import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateToken } from "../utils/jwt.utils.ts";

const donorSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Invalid phone number"),
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bloodBank: z.string().min(1),
  city: z.string().min(1),
  status: z.boolean(),
  state: z.string().min(1),
  bloodType: z.string(),
  age: z.number().positive().int(),
});

/**
 *
 * @param req the data of donors
 * @param res will give the response of operations
 */

const donorR = async (req: Request, res: Response): Promise<void> => {
  const patientData = donorSchema.parse(req.body);
  try {
    const userExists = await prisma.donors.findFirst({
      where: {
        OR: [{ email: patientData.email }, { phone: patientData.phone }],
      },
    });
    if (userExists) {
      res.status(409).json({
        message:
          userExists.email === patientData.email
            ? "User already exists with this email"
            : "User already exists with this phone number",
      });
    } else {
      //heash password
      const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10");

      const hashedPassword = await bcrypt.hash(
        patientData.password,
        SALT_ROUNDS
      );

      const pushUser = await prisma.donors.create({
        data: {
          name: patientData.name,
          email: patientData.email,
          password: hashedPassword,
          phone: patientData.phone,
          BloodBank: patientData.bloodBank,
          BloodType: patientData.bloodType,
          city: patientData.city,
          status: patientData.status,
          state: patientData.state,
          age: patientData.age,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      //creating jwt token
      const token = generateToken(pushUser.id);

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "user added",
        pushUser,
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
export { donorR };
