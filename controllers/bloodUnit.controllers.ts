import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Input validation schema for using blood unit
const useBloodUnitSchema = z.object({
  bloodUnitId: z.uuid("Invalid blood unit ID format"),
  patientId: z.uuid("Invalid patient ID format"),
  notes: z.string().max(500).optional(),
});

// Mark blood unit as used for a patient
const useBloodUnit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = useBloodUnitSchema.parse(req.body);
    const { bloodUnitId, patientId, notes } = validatedData;
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    // Find the blood unit
    const bloodUnit = await prisma.bloodUnit.findFirst({
      where: {
        id: bloodUnitId,
        bloodBankId: bloodBankUserId,
        status: "available",
      },
    });

    if (!bloodUnit) {
      return res.status(404).json({
        error: "Blood unit not found or not available.",
        success: false,
      });
    }

    // Check if blood unit is expired
    const currentDate = new Date();
    if (currentDate > bloodUnit.expiryDate) {
      return res.status(400).json({
        error: "Blood unit has expired and cannot be used.",
        success: false,
      });
    }

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: {
        id: patientId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        error: "Patient not found.",
        success: false,
      });
    }

    // Update blood unit status to used
    const updatedBloodUnit = await prisma.bloodUnit.update({
      where: {
        id: bloodUnitId,
      },
      data: {
        status: "used",
        usedAt: currentDate,
        patientUsedFor: patientId,
        notes: notes,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Blood unit marked as used successfully.",
      data: updatedBloodUnit,
    });
  } catch (error) {
    console.error("Error in useBloodUnit handler:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input data.",
        success: false,
        details: error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

// Allocate multiple blood units for a patient
const allocateBloodUnits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, bloodType, unitsNeeded, notes } = req.body;
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        error: "Patient not found.",
        success: false,
      });
    }

    const currentDate = new Date();

    // Find available blood units of the required type
    const availableUnits = await prisma.bloodUnit.findMany({
      where: {
        bloodBankId: bloodBankUserId,
        donorBloodType: bloodType,
        status: "available",
        expiryDate: {
          gt: currentDate,
        },
      },
      orderBy: {
        expiryDate: "asc", // Use oldest units first (FIFO)
      },
      take: unitsNeeded,
    });

    if (availableUnits.length < unitsNeeded) {
      return res.status(400).json({
        error: `Not enough blood units available. Requested: ${unitsNeeded}, Available: ${availableUnits.length}`,
        success: false,
        availableUnits: availableUnits.length,
      });
    }

    // Allocate the units using transaction
    const result = await prisma.$transaction(async (tx) => {
      const allocatedUnits = [];

      for (const unit of availableUnits) {
        const updatedUnit = await tx.bloodUnit.update({
          where: { id: unit.id },
          data: {
            status: "used",
            usedAt: currentDate,
            patientUsedFor: patientId,
            notes: notes,
          },
        });
        allocatedUnits.push(updatedUnit);
      }

      return allocatedUnits;
    });

    return res.status(200).json({
      success: true,
      message: `Successfully allocated ${result.length} blood units to patient.`,
      data: {
        patientId,
        bloodType,
        unitsAllocated: result.length,
        units: result,
      },
    });
  } catch (error) {
    console.error("Error in allocateBloodUnits handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

// Mark expired blood units
const markExpiredBloodUnits = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    const currentDate = new Date();

    // Find all available blood units that are past expiry date
    const expiredUnits = await prisma.bloodUnit.updateMany({
      where: {
        bloodBankId: bloodBankUserId,
        status: "available",
        expiryDate: {
          lt: currentDate,
        },
      },
      data: {
        status: "expired",
      },
    });

    return res.status(200).json({
      success: true,
      message: `${expiredUnits.count} blood units marked as expired.`,
      data: {
        expiredCount: expiredUnits.count,
      },
    });
  } catch (error) {
    console.error("Error in markExpiredBloodUnits handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

// Get blood inventory summary
const getBloodInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    const currentDate = new Date();

    // Get all blood units for the blood bank
    const bloodUnits = await prisma.bloodUnit.findMany({
      where: {
        bloodBankId: bloodBankUserId,
      },
      select: {
        id: true,
        unitNumber: true,
        donorBloodType: true,
        volume: true,
        status: true,
        expiryDate: true,
        donationDate: true,
        barcode: true,
      },
    });

    // Create inventory summary
    const inventory: any = {};
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    bloodTypes.forEach((bloodType) => {
      const typeUnits = bloodUnits.filter(
        (unit) => unit.donorBloodType === bloodType
      );

      inventory[bloodType] = {
        total: typeUnits.length, // Each unit is individual now
        available: typeUnits.filter(
          (unit) => unit.status === "available" && unit.expiryDate > currentDate
        ).length,
        used: typeUnits.filter((unit) => unit.status === "used").length,
        expired: typeUnits.filter(
          (unit) =>
            unit.status === "expired" ||
            (unit.status === "available" && unit.expiryDate <= currentDate)
        ).length,
        expiringSoon: typeUnits.filter((unit) => {
          const daysToExpiry = Math.ceil(
            (unit.expiryDate.getTime() - currentDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return (
            unit.status === "available" && daysToExpiry <= 7 && daysToExpiry > 0
          );
        }).length,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Blood inventory retrieved successfully.",
      data: {
        inventory,
        totalAvailable: Object.values(inventory).reduce(
          (sum: any, type: any) => sum + type.available,
          0
        ),
        totalExpired: Object.values(inventory).reduce(
          (sum: any, type: any) => sum + type.expired,
          0
        ),
        totalUsed: Object.values(inventory).reduce(
          (sum: any, type: any) => sum + type.used,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error in getBloodInventory handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

export {
  useBloodUnit,
  allocateBloodUnits,
  markExpiredBloodUnits,
  getBloodInventory,
};
