import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import { z } from "zod";
import PDFService from "../services/pdf.service.ts";
import path from 'path'
import{v2 as cloudinary} from 'cloudinary'
import fs from 'fs/promises'
import { file } from "pdfkit";
// import dotenv from 'dotenv'
// dotenv.config()

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Ensure secure URLs are generated
});


// Input validation schema for accepting donation


const acceptDonationSchema = z.object({
  donationRequestId: z.uuid("Invalid donation request ID format"),
  numberOfUnits: z.number().min(1).max(10).optional().default(1),
  notes: z.string().max(500).optional(),
  expiryDays: z.number().min(1).max(42).optional().default(35),
});

const acceptDonation = async (req: AuthenticatedRequest, res: Response) => {
  // Define pdfFilePath here to ensure it's accessible in the final catch block for cleanup
  let pdfFilePath: string | null = null;
  
  try {
    const validatedData = acceptDonationSchema.parse(req.body);
    const { donationRequestId, numberOfUnits, notes, expiryDays } = validatedData;
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    const donationRequest = await prisma.donationRequest.findFirst({
      where: { id: donationRequestId, bloodBankId: bloodBankUserId, status: "pending" },
    });

    if (!donationRequest) {
      return res.status(404).json({
        error: "Donation request not found or not pending.",
        success: false,
      });
    }
    
    const bloodBank = await prisma.bloodBanks.findUnique({
        where: { id: bloodBankUserId },
        select: { id: true, name: true, address: true },
    });

    if (!bloodBank) {
        return res.status(404).json({ error: "Blood bank not found.", success: false });
    }

    const donationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(donationDate.getDate() + expiryDays);

    // --- Database Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      const updatedDonationRequest = await tx.donationRequest.update({
        where: { id: donationRequestId },
        data: { status: "success" },
      });

      const bloodUnits = [];
      for (let i = 1; i <= numberOfUnits; i++) {
        const bloodUnit = await tx.bloodUnit.create({
          data: {
            unitNumber: i.toString(),
            donationRequestId,
            donorId: donationRequest.donorId,
            donorName: donationRequest.donor,
            donorBloodType: donationRequest.donorBloodType,
            bloodBankId: bloodBank.id,
            bloodBankName: bloodBank.name,
            donationDate,
            expiryDate,
            volume: 450,
            status: "available",
            barcode: `${bloodBank.name}-${donationRequestId.slice(-8)}-${i}`,
            notes,
          },
        });
        bloodUnits.push(bloodUnit);
      }
      return { updatedDonationRequest, bloodUnits };
    });

    // --- PDF Generation and Cloudinary Upload ---
    let certificateUrl: string | null = null;
    let finalMessage = `Donation accepted successfully and ${result.bloodUnits.length} blood units created.`;

    try {
      const donorDetails = await prisma.donors.findUnique({
        where: { id: donationRequest.donorId },
        select: { name: true, email: true, phone: true, age: true },
      });

      const patientDetails = await prisma.patients.findUnique({
        where: { id: donationRequest.patientId },
        select: { BloodType: true },
      });

      if (donorDetails && patientDetails) {
        // Step 1: Generate PDF and get local file path from your service
        pdfFilePath = await PDFService.generateDonationCertificate({
            donorName: donorDetails.name,
            donorId: donationRequest.donorId,
            donorEmail: donorDetails.email,
            donorPhone: donorDetails.phone,
            donorBloodType: donationRequest.donorBloodType,
            donorAge: donorDetails.age,
            bloodBankName: bloodBank.name,
            bloodBankAddress: bloodBank.address || `${bloodBank.name} Blood Bank`,
            donationDate,
            numberOfUnits,
            bloodUnits: result.bloodUnits.map((unit: any) => ({
                id: unit.id, unitNumber: unit.unitNumber, barcode: unit.barcode || "N/A",
                volume: unit.volume, expiryDate: unit.expiryDate,
            })),
            donationRequestId,
            urgencyLevel: donationRequest.urgencyLevel || "medium",
            patientBloodType: patientDetails.BloodType,
        });
        
        // Step 2: Upload the local file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(pdfFilePath, {
            folder: 'donation_certificates',
            public_id: `certificate_${donationRequestId}`,
            resource_type: 'raw', // Use 'raw' for non-image files like PDFs
        });

        // Step 3: Get URL and save to database
        certificateUrl = uploadResult.secure_url;
        await prisma.donationRequest.update({
          where: { id: donationRequestId },
          data: { certificateUrl: certificateUrl },
        });

        finalMessage += " Certificate is available for download.";
      } else {
         finalMessage += " Certificate could not be generated due to missing details.";
      }
    } catch (pdfError) {
      console.error("PDF generation or upload failed:", pdfError);
      finalMessage += " Certificate generation failed, but the donation was processed.";
    } finally {
        // Step 4: IMPORTANT - Clean up the temporary local file
        if (pdfFilePath) {
            await fs.unlink(pdfFilePath);
        }
    }

    return res.status(200).json({
      success: true,
      message: finalMessage,
      data: {
        donationRequest: result.updatedDonationRequest,
        bloodUnits: result.bloodUnits,
        totalUnitsCreated: result.bloodUnits.length,
        certificateUrl: certificateUrl,
      },
    });

  } catch (error) {
    // Also clean up temp file in case of an error during the main process
    if (pdfFilePath) {
        await fs.unlink(pdfFilePath).catch(err => console.error("Failed to cleanup temp PDF file on error:", err));
    }

    console.error("Error in acceptDonation handler:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input data.",
        success: false,
        details: error.issues.map((err) => ({
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

// Reject donation request
const rejectDonation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { donationRequestId } = req.params;
    const { reason } = req.body;
    const bloodBankUserId = req.user?.userId;

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    // Find and update the donation request
    const donationRequest = await prisma.donationRequest.findFirst({
      where: {
        id: donationRequestId,
        bloodBankId: bloodBankUserId,
        status: "pending",
      },
    });

    if (!donationRequest) {
      return res.status(404).json({
        error: "Donation request not found or not pending.",
        success: false,
      });
    }

    const updatedDonationRequest = await prisma.donationRequest.update({
      where: {
        id: donationRequestId,
      },
      data: {
        status: "rejected",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Donation request rejected.",
      data: updatedDonationRequest,
    });
  } catch (error) {
    console.error("Error in rejectDonation handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

// Get all blood units for a blood bank
const getBloodUnits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bloodBankUserId = req.user?.userId;
    const { status } = req.query; // Optional filter by status

    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    const whereClause: any = {
      bloodBankId: bloodBankUserId,
    };

    if (status && typeof status === "string") {
      whereClause.status = status;
    }

    const bloodUnits = await prisma.bloodUnit.findMany({
      where: whereClause,
      include: {
        donationRequest: {
          select: {
            patientId: true,
            urgencyLevel: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        donationDate: "desc",
      },
    });

    const summary = {
      total: bloodUnits.length,
      available: bloodUnits.filter((unit:any) => unit.status === "available")
        .length,
      used: bloodUnits.filter((unit:any) => unit.status === "used").length,
      expired: bloodUnits.filter((unit:any) => unit.status === "expired").length,
      discarded: bloodUnits.filter((unit:any) => unit.status === "discarded")
        .length,
      byBloodType: bloodUnits.reduce((acc: any, unit:any) => {
        acc[unit.donorBloodType] = (acc[unit.donorBloodType] || 0) + 1; // Each unit counts as 1
        return acc;
      }, {}),
    };

    return res.status(200).json({
      success: true,
      message: "Blood units retrieved successfully.",
      data: bloodUnits,
      summary,
    });
  } catch (error) {
    console.error("Error in getBloodUnits handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

export { acceptDonation, rejectDonation, getBloodUnits };
