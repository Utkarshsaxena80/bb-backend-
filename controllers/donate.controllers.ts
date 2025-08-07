import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Input validation schema
const donationRequestSchema = z.object({
  patientId: z.uuid("Invalid patient ID format"),
  urgencyLevel: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .default("medium"),
  requiredUnits: z.number().min(1).max(10).optional().default(1),
  notes: z.string().max(500).optional(),
  preferredDate: z.string().datetime().optional(),
});

const donate1 = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validatedData = donationRequestSchema.parse(req.body);
    const { patientId, urgencyLevel, requiredUnits, notes, preferredDate } =
      validatedData;
    const donorId = req.user?.userId;

    // Validate required inputs
    if (!donorId) {
      return res.status(401).json({
        error: "Unauthorized. Donor ID missing.",
        success: false,
      });
    }

    if (!patientId) {
      return res.status(400).json({
        error: "Patient ID is required.",
        success: false,
      });
    }

    // Get donor details
    const getDonorDetails = await prisma.donors.findUnique({
      where: {
        id: donorId,
      },
      select: {
        id: true,
        name: true,
        BloodBank: true,
        BloodType: true,
        city: true,
      },
    });

    if (!getDonorDetails) {
      return res.status(404).json({
        error: "Donor not found.",
        success: false,
      });
    }

    if (!getDonorDetails.BloodBank || !getDonorDetails.city) {
      return res.status(400).json({
        error:
          "Donor profile incomplete. Blood bank or city information missing.",
        success: false,
      });
    }

    // Get patient details
    const getPatientDetails = await prisma.patients.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
        name: true,
        BloodBank: true,
        BloodType: true,
        city: true,
      },
    });

    if (!getPatientDetails) {
      return res.status(404).json({
        error: "Patient not found.",
        success: false,
      });
    }

    if (!getPatientDetails.BloodBank || !getPatientDetails.city) {
      return res.status(400).json({
        error:
          "Patient profile incomplete. Blood bank or city information missing.",
        success: false,
      });
    }

    // Check blood type compatibility
    if (
      !isBloodTypeCompatible(
        getDonorDetails.BloodType,
        getPatientDetails.BloodType
      )
    ) {
      return res.status(400).json({
        error: `Blood type incompatible. Donor (${getDonorDetails.BloodType}) cannot donate to patient (${getPatientDetails.BloodType}).`,
        success: false,
        compatibilityInfo: getBloodTypeInfo(
          getDonorDetails.BloodType,
          getPatientDetails.BloodType
        ),
      });
    }

    // Check donor eligibility (last donation date)
    const eligibilityCheck = await checkDonorEligibility(getDonorDetails.id);
    if (!eligibilityCheck.eligible) {
      return res.status(400).json({
        error: eligibilityCheck.reason,
        success: false,
        nextEligibleDate: eligibilityCheck.nextEligibleDate,
      });
    }
    const getDonorBloodBankDetails = await prisma.bloodBanks.findFirst({
      where: {
        name: getDonorDetails.BloodBank,
        city: getDonorDetails.city,
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
    });

    if (!getDonorBloodBankDetails) {
      return res.status(404).json({
        error: "Donor's associated blood bank not found.",
        success: false,
      });
    }

    const existingRequest = await prisma.donationRequest.findFirst({
      where: {
        donorId: getDonorDetails.id,
        patientId: patientId,
        status: "pending",
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        error: "You already have a pending donation request for this patient.",
        success: false,
        existingRequestId: existingRequest.id,
      });
    }

    // Create donation request
    const donationRequest = await prisma.donationRequest.create({
      data: {
        donorId: getDonorDetails.id,
        donor: getDonorDetails.name,
        bloodBankId: getDonorBloodBankDetails.id,
        bloodBank: getDonorBloodBankDetails.name,
        donorBloodType: getDonorDetails.BloodType,
        patientId: patientId,
        patientCity: getPatientDetails.city,
        patientBloodBankId: getPatientDetails.BloodBank, // Fix: use actual patient blood bank
        patientBloodBankName: getPatientDetails.BloodBank,
        patientBloodType: getPatientDetails.BloodType,
        // Additional fields (you may need to add these to your Prisma schema)
        // urgencyLevel: urgencyLevel,
        // requiredUnits: requiredUnits,
        // notes: notes,
        // preferredDate: preferredDate ? new Date(preferredDate) : null
      },
    });

    // Success response
    const responseData = {
      success: true,
      message: "Donation request submitted successfully.",
      data: {
        requestId: donationRequest.id,
        donor: {
          id: getDonorDetails.id,
          name: getDonorDetails.name,
          bloodType: getDonorDetails.BloodType,
          city: getDonorDetails.city,
          bloodBank: getDonorBloodBankDetails.name,
        },
        patient: {
          id: getPatientDetails.id,
          name: getPatientDetails.name,
          bloodType: getPatientDetails.BloodType,
          city: getPatientDetails.city,
          bloodBank: getPatientDetails.BloodBank,
        },
        urgencyLevel: urgencyLevel,
        requiredUnits: requiredUnits,
        status: donationRequest.status,
        createdAt: donationRequest.createdAt,
        estimatedProcessingTime: "24-48 hours",
      },
    };

    // Send notifications (async, don't wait for completion)
    sendNotification("donation_request", {
      donorName: getDonorDetails.name,
      patientName: getPatientDetails.name,
      bloodType: getDonorDetails.BloodType,
      requestId: donationRequest.id,
    }).catch((err) => console.error("Notification failed:", err));

    // Log analytics
    logDonationAnalytics(
      donationRequest,
      getDonorDetails,
      getPatientDetails
    ).catch((err) => console.error("Analytics logging failed:", err));

    return res.status(201).json(responseData);
  } catch (error) {
    console.error("Error in donate1 handler:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        success: false,
        validationErrors: error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Handle specific Prisma errors
    if (typeof error === "object" && error !== null && "code" in error) {
      const err = error as { code?: string; message?: string };

      switch (err.code) {
        case "P2002":
          return res.status(409).json({
            error: "Duplicate donation request.",
            success: false,
          });
        case "P2025":
          return res.status(404).json({
            error: "Required record not found.",
            success: false,
          });
        case "P2003":
          return res.status(400).json({
            error: "Invalid reference to related record.",
            success: false,
          });
        default:
          console.error("Unhandled Prisma error:", err);
      }
    }

    // Handle network/timeout errors
    if (error instanceof Error && error.message.includes("timeout")) {
      return res.status(408).json({
        error: "Request timeout. Please try again.",
        success: false,
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
      message:
        "Something went wrong while processing your donation request. Please try again later.",
    });
  }
};

// Blood type compatibility checker with enhanced logic
function isBloodTypeCompatible(
  donorType: string,
  patientType: string
): boolean {
  const compatibility: Record<string, string[]> = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // Universal donor
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"], // Universal receiver (as patient)
  };

  return compatibility[donorType]?.includes(patientType) || false;
}

// Get blood type compatibility information
function getBloodTypeInfo(donorType: string, patientType: string) {
  return {
    donorType,
    patientType,
    compatible: isBloodTypeCompatible(donorType, patientType),
    donorCanDonateTo: getDonationCompatibility(donorType),
    patientCanReceiveFrom: getReceptionCompatibility(patientType),
  };
}

// Get all blood types a donor can donate to
function getDonationCompatibility(bloodType: string): string[] {
  const compatibility: Record<string, string[]> = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
  };
  return compatibility[bloodType] || [];
}

// Get all blood types a patient can receive from
function getReceptionCompatibility(bloodType: string): string[] {
  const canReceiveFrom: Record<string, string[]> = {
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  };
  return canReceiveFrom[bloodType] || [];
}

// Check if donor is eligible to donate (based on last donation)
async function checkDonorEligibility(donorId: string): Promise<{
  eligible: boolean;
  reason?: string;
  nextEligibleDate?: Date;
  lastDonationDate?: Date;
}> {
  try {
    // Find the most recent successful donation
    const lastDonation = await prisma.donationRequest.findFirst({
      where: {
        donorId: donorId,
        status: "completed", // Assuming you have a completed status
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (!lastDonation) {
      // First time donor - eligible
      return { eligible: true };
    }

    // Check if 56 days (8 weeks) have passed since last donation
    const daysSinceLastDonation = Math.floor(
      (Date.now() - lastDonation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const minimumDaysBetweenDonations = 56; // Standard waiting period

    if (daysSinceLastDonation < minimumDaysBetweenDonations) {
      const nextEligibleDate = new Date(lastDonation.createdAt);
      nextEligibleDate.setDate(
        nextEligibleDate.getDate() + minimumDaysBetweenDonations
      );

      return {
        eligible: false,
        reason: `You must wait ${
          minimumDaysBetweenDonations - daysSinceLastDonation
        } more days before donating again.`,
        nextEligibleDate,
        lastDonationDate: lastDonation.createdAt,
      };
    }

    return {
      eligible: true,
      lastDonationDate: lastDonation.createdAt,
    };
  } catch (error) {
    console.error("Error checking donor eligibility:", error);
    // In case of error, allow donation but log the issue
    return { eligible: true };
  }
}

// Send notification (placeholder - implement with your preferred service)
async function sendNotification(
  type: "donation_request" | "donation_accepted" | "donation_completed",
  data: any
) {
  // TODO: Implement with email service, SMS, push notifications, etc.
  console.log(`Notification [${type}]:`, data);

  // Example implementation ideas:
  // - Send email to patient about new donation offer
  // - Send SMS to donor about request status
  // - Push notification to mobile app
  // - Log to notification table in database
}

// Log donation request for analytics
async function logDonationAnalytics(
  donationRequest: any,
  donor: any,
  patient: any
) {
  try {
    // You could create a separate analytics table or use external service
    console.log("Analytics Log:", {
      requestId: donationRequest.id,
      donorCity: donor.city,
      patientCity: patient.city,
      bloodType: donor.BloodType,
      timestamp: donationRequest.createdAt,
      isCrossCityDonation: donor.city !== patient.city,
    });

    // TODO: Store in analytics database, send to analytics service, etc.
  } catch (error) {
    console.error("Failed to log analytics:", error);
    // Don't fail the main operation if analytics fails
  }
}

export { donate1 };
