import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../utils/prisma.utils.ts";
import PDFService from "../services/pdf.service.ts";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Download donation certificate PDF
const downloadDonationCertificate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { donationRequestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized. User ID missing.",
        success: false,
      });
    }

    // Find the donation request and check if user is the donor
    const donationRequest = await prisma.donationRequest.findFirst({
      where: {
        id: donationRequestId,
        donorId: userId, // Ensure donor can only download their own certificate
        status: "success",
      },
    });

    if (!donationRequest) {
      return res.status(404).json({
        error: "Donation request not found or not successful.",
        success: false,
      });
    }

    // Get all related data for PDF generation
    const [donorDetails, patientDetails, bloodBank, bloodUnits] =
      await Promise.all([
        prisma.donors.findUnique({
          where: { id: donationRequest.donorId },
          select: {
            name: true,
            email: true,
            phone: true,
            age: true,
          },
        }),
        prisma.patients.findUnique({
          where: { id: donationRequest.patientId },
          select: {
            BloodType: true,
          },
        }),
        prisma.bloodBanks.findUnique({
          where: { id: donationRequest.bloodBankId },
          select: {
            name: true,
            address: true,
          },
        }),
        prisma.bloodUnit.findMany({
          where: { donationRequestId: donationRequestId },
          select: {
            id: true,
            unitNumber: true,
            barcode: true,
            volume: true,
            expiryDate: true,
            donationDate: true,
          },
        }),
      ]);

    if (!donorDetails || !patientDetails || !bloodBank) {
      return res.status(404).json({
        error: "Required data not found for certificate generation.",
        success: false,
      });
    }

    // Generate PDF certificate
    const pdfFilePath = await PDFService.generateDonationCertificate({
      donorName: donorDetails.name,
      donorId: donationRequest.donorId,
      donorEmail: donorDetails.email,
      donorPhone: donorDetails.phone,
      donorBloodType: donationRequest.donorBloodType,
      donorAge: donorDetails.age,
      bloodBankName: bloodBank.name,
      bloodBankAddress: bloodBank.address || `${bloodBank.name} Blood Bank`,
      donationDate: bloodUnits[0]?.donationDate || new Date(),
      numberOfUnits: bloodUnits.length,
      bloodUnits: bloodUnits.map((unit) => ({
        id: unit.id,
        unitNumber: unit.unitNumber,
        barcode: unit.barcode || "N/A",
        volume: unit.volume,
        expiryDate: unit.expiryDate,
      })),
      donationRequestId: donationRequestId,
      urgencyLevel: donationRequest.urgencyLevel || "medium",
      patientBloodType: patientDetails.BloodType,
    });

    // Check if file exists
    if (!fs.existsSync(pdfFilePath)) {
      return res.status(404).json({
        error: "PDF certificate file not found.",
        success: false,
      });
    }

    // Set headers for PDF download
    const filename = `donation-certificate-${donorDetails.name.replace(
      /\s+/g,
      "-"
    )}-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(pdfFilePath).size);

    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfFilePath);
    fileStream.pipe(res);

    // Clean up the temporary file after streaming (optional)
    fileStream.on("end", () => {
      setTimeout(() => {
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
        }
      }, 5000); // Delete after 5 seconds
    });
  } catch (error) {
    console.error("Error in downloadDonationCertificate handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

// Get donor's donation history with certificate download links
const getDonorDonationHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const donorId = req.user?.userId;

    if (!donorId) {
      return res.status(401).json({
        error: "Unauthorized. Donor ID missing.",
        success: false,
      });
    }

    // Get all successful donations for this donor
    const donations = await prisma.donationRequest.findMany({
      where: {
        donorId: donorId,
        status: "success",
      },
      include: {
        bloodUnits: {
          select: {
            id: true,
            unitNumber: true,
            volume: true,
            status: true,
            usedAt: true,
            patientUsedFor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const history = donations.map((donation) => ({
      donationId: donation.id,
      donationDate: donation.createdAt,
      bloodType: donation.donorBloodType,
      bloodBank: donation.bloodBank,
      unitsCount: donation.bloodUnits.length,
      totalVolume: donation.bloodUnits.length * 450,
      unitsUsed: donation.bloodUnits.filter((unit) => unit.status === "used")
        .length,
      urgencyLevel: donation.urgencyLevel,
      certificateDownloadUrl: `/donations/certificate/${donation.id}/download`,
    }));

    return res.status(200).json({
      success: true,
      message: "Donation history retrieved successfully.",
      data: {
        totalDonations: history.length,
        totalUnits: history.reduce(
          (sum, donation) => sum + donation.unitsCount,
          0
        ),
        totalVolume: history.reduce(
          (sum, donation) => sum + donation.totalVolume,
          0
        ),
        donations: history,
      },
    });
  } catch (error) {
    console.error("Error in getDonorDonationHistory handler:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      success: false,
    });
  }
};

export { downloadDonationCertificate, getDonorDonationHistory };
