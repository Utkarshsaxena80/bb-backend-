import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import { z } from "zod";

const requiredField = z.object({
  field: z.enum(["1", "2"]).transform((val) => parseInt(val) as 1 | 2),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City name too long")
    .trim(),
});

interface UserResponse {
  id?: string;
  name: string;
  email: string;
  phone: string;
  BloodBank: string;
  BloodType: string;
  city?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const bycity = async (req: Request, res: Response): Promise<void> => {
  try {
    const fields = requiredField.parse(req.query);
    const normalizedCity = fields.city.toLowerCase().trim();

    if (fields.field === 1) {
      const patients = await prisma.patients.findMany({
        where: {
          city: {
            equals: normalizedCity,
            mode: "insensitive",
          },
          status: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          BloodBank: true,
          BloodType: true,
          city: true,
          status: true,
        },
        take: 50,
        orderBy: {
          createdAt: "desc",
        },
      });

      if (patients && patients.length > 0) {
        const response: ApiResponse<UserResponse[]> = {
          success: true,
          message: `Found ${patients.length} patient(s) in ${fields.city}`,
          data: patients,
        };
        res.status(200).json(response);
        return;
      } else {
        const response: ApiResponse = {
          success: false,
          message: `No patients found in ${fields.city}`,
        };
        res.status(404).json(response);
        return;
      }
    } else if (fields.field === 2) {
      const donors = await prisma.donors.findMany({
        where: {
          city: {
            equals: normalizedCity,
            mode: "insensitive",
          },
          status: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          BloodBank: true,
          BloodType: true,
          city: true,
          status: true,
        },
        take: 50,
        orderBy: {
          createdAt: "desc",
        },
      });

      if (donors && donors.length > 0) {
        const response: ApiResponse<UserResponse[]> = {
          success: true,
          message: `Found ${donors.length} donor(s) in ${fields.city}`,
          data: donors,
        };
        res.status(200).json(response);
        return;
      } else {
        const response: ApiResponse = {
          success: false,
          message: `No donors found in ${fields.city}`,
        };
        res.status(404).json(response);
        return;
      }
    }
  } catch (error) {
    console.error("Error in bycity endpoint:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: "Invalid input data",
        error: error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
      res.status(400).json(response);
      return;
    }

    // Handle Prisma constraint violations
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      const response: ApiResponse = {
        success: false,
        message: "Database constraint violation",
        error: "Duplicate entry found",
      };
      res.status(409).json(response);
      return;
    }

    // Generic error handler
    const response: ApiResponse = {
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
    };
    res.status(500).json(response);
  }
};

export { bycity };
