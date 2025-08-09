import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
import PDFService from "../services/pdf.service.ts"; // Your PDF generation logic

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Controller to generate and stream the PDF on-the-fly
const downloadDonationCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { donationRequestId } = req.params;
    const userId = req.user?.userId;

    // 1. Verify the user has permission to download this certificate
    const donationRequest = await prisma.donationRequest.findFirst({
      where: {
        id: donationRequestId,
        // Ensure either the donor or the blood bank can download
        OR: [{ donorId: userId }, { bloodBankId: userId }],
        status: 'success', // Only allow download for successful donations
      },
    });

    if (!donationRequest) {
      return res.status(404).send("Certificate not found or you do not have permission to view it.");
    }

    // 2. Fetch all necessary data for the certificate from the database
    const [donorDetails, patientDetails, bloodBank, bloodUnits] = await Promise.all([
      prisma.donors.findUnique({ where: { id: donationRequest.donorId } }),
      prisma.patients.findUnique({ where: { id: donationRequest.patientId } }),
      prisma.bloodBanks.findUnique({ where: { id: donationRequest.bloodBankId } }),
      prisma.bloodUnit.findMany({ where: { donationRequestId: donationRequestId } }),
    ]);

    if (!donorDetails || !patientDetails || !bloodBank) {
      return res.status(500).send("Could not retrieve all necessary data for the certificate.");
    }

    // 3. Generate the PDF document IN MEMORY
    const pdfDoc = await PDFService.generateDonationCertificate({
      donorName: donorDetails.name,
      donorId: donationRequest.donorId,
      donorEmail: donorDetails.email,
      donorPhone: donorDetails.phone,
      donorBloodType: donationRequest.donorBloodType,
      donorAge: donorDetails.age,
      bloodBankName: bloodBank.name,
      bloodBankAddress: bloodBank.address || `${bloodBank.name} Blood Bank`,
      donationDate: new Date(), // Or use a stored date
      numberOfUnits: bloodUnits.length,
      bloodUnits: bloodUnits.map(unit => ({
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

    // 4. Set headers to tell the browser this is a downloadable PDF
    const filename = `donation-certificate-${donationRequestId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // 5. Stream the generated PDF directly to the user's browser
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error("Error generating PDF certificate:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
};

export { downloadDonationCertificate };