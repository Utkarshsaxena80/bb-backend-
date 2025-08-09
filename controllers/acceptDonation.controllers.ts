import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import { z } from "zod";
import PDFService from "../services/pdf.service.ts";
import path from 'path'
import { file } from "pdfkit";


interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Input validation schema for accepting donation
const acceptDonationSchema = z.object({
  donationRequestId: z.uuid("Invalid donation request ID format"),
  numberOfUnits: z.number().min(1).max(10).optional().default(1),
  notes: z.string().max(500).optional(),
  expiryDays: z.number().min(1).max(42).optional().default(35), // Blood typically expires in 35 days
});

// Accept donation request and create blood units
const acceptDonation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validatedData = acceptDonationSchema.parse(req.body);
    const { donationRequestId, numberOfUnits, notes, expiryDays } =
      validatedData;
    const bloodBankUserId = req.user?.userId;

    // Validate required inputs
    if (!bloodBankUserId) {
      return res.status(401).json({
        error: "Unauthorized. Blood bank ID missing.",
        success: false,
      });
    }

    // Find the donation request
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

    // Get blood bank details
    const bloodBank = await prisma.bloodBanks.findUnique({
      where: {
        id: bloodBankUserId,
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    if (!bloodBank) {
      return res.status(404).json({
        error: "Blood bank not found.",
        success: false,
      });
    }

    // Calculate expiry date
    const donationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(donationDate.getDate() + expiryDays);

    // Start transaction to update donation status and create blood units
    const result = await prisma.$transaction(async (tx:any) => {
      // Update donation request status to success
      const updatedDonationRequest = await tx.donationRequest.update({
        where: {
          id: donationRequestId,
        },
        data: {
          status: "success",
        },
      });

      const bloodUnits = [];
      for (let i = 1; i <= numberOfUnits; i++) {
        const bloodUnit = await tx.bloodUnit.create({
          data: {
            unitNumber: i.toString(),
            donationRequestId: donationRequestId,
            donorId: donationRequest.donorId,
            donorName: donationRequest.donor,
            donorBloodType: donationRequest.donorBloodType,
            bloodBankId: bloodBank.id,
            bloodBankName: bloodBank.name,
            donationDate: donationDate,
            expiryDate: expiryDate,
            volume: 450, // Standard blood bag volume
            status: "available",
            barcode: `${bloodBank.name}-${donationRequestId.slice(-8)}-${i}`, // Generate barcode
            notes: notes,
          },
        });
        bloodUnits.push(bloodUnit);
      }

      return { updatedDonationRequest, bloodUnits };
    });
//changes-->

const certificateUrl=`/donations/certificate/${donationRequestId}/download`

return res.status(200).json({
        success: true,
      message: "Donation accepted successfully. Certificate is available for download.",
      data: {
        donationRequest: result.updatedDonationRequest,
        bloodUnits: result.bloodUnits,
        totalUnitsCreated: result.bloodUnits.length,
        certificateUrl: certificateUrl, 
}
  })

//to here 

    // Generate PDF certificate
    //try {
      // Get donor and patient details for PDF
    //   const donorDetails = await prisma.donors.findUnique({
    //     where: { id: donationRequest.donorId },
    //     select: {
    //       name: true,
    //       email: true,
    //       phone: true,
    //       age: true,
    //     },
    //   });

    //   const patientDetails = await prisma.patients.findUnique({
    //     where: { id: donationRequest.patientId },
    //     select: {
    //       BloodType: true,
    //     },
    //   });

    //   if (donorDetails && patientDetails) {
    //     // Generate PDF certificate
    //     const pdfFilePath = await PDFService.generateDonationCertificate({
    //       donorName: donorDetails.name,
    //       donorId: donationRequest.donorId,
    //       donorEmail: donorDetails.email,
    //       donorPhone: donorDetails.phone,
    //       donorBloodType: donationRequest.donorBloodType,
    //       donorAge: donorDetails.age,
    //       bloodBankName: bloodBank.name,
    //       bloodBankAddress: bloodBank.address || `${bloodBank.name} Blood Bank`,
    //       donationDate: donationDate,
    //       numberOfUnits: numberOfUnits,
    //       bloodUnits: result.bloodUnits.map((unit:any) => ({
    //         id: unit.id,
    //         unitNumber: unit.unitNumber,
    //         barcode: unit.barcode || "N/A",
    //         volume: unit.volume,
    //         expiryDate: unit.expiryDate,
    //       })),
    //       donationRequestId: donationRequestId,
    //       urgencyLevel: donationRequest.urgencyLevel || "medium",
    //       patientBloodType: patientDetails.BloodType,
    //     });
    //     const filename=path.basename(pdfFilePath)
    //     const pdfUrl=`/certificates/${filename}`
    //     return res.status(200).json({
    //       success: true,
    //       message: `Donation accepted successfully and ${numberOfUnits} individual blood units created. PDF certificate generated.`,
    //       data: {
    //         donationRequest: result.updatedDonationRequest,
    //         bloodUnits: result.bloodUnits,
    //         totalUnitsCreated: result.bloodUnits.length,
    //         certificateUrl: pdfUrl,
    //       },
    //     });
    //   }
    // } catch (pdfError) {
    //   console.error("PDF generation failed:", pdfError);
    //   // Still return success but note PDF generation failed
    // }

    // // Success response (fallback if PDF generation fails)
    // return res.status(200).json({
    //   success: true,
    //   message: `Donation accepted successfully and ${numberOfUnits} individual blood units created.`,
    //   data: {
    //     donationRequest: result.updatedDonationRequest,
    //     bloodUnits: result.bloodUnits,
    //     totalUnitsCreated: result.bloodUnits.length,
    //     note: "PDF certificate generation failed, but donation was processed successfully.",
    //   },
    // });
  } catch (error) {
    console.error("Error in acceptDonation handler:", error);

    // Handle Zod validation errors
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

    // Handle specific Prisma errors
    if (typeof error === "object" && error !== null && "code" in error) {
      const err = error as { code?: string };

      if (err.code === "P2025") {
        return res.status(404).json({
          error: "Record not found.",
          success: false,
        });
      }
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
