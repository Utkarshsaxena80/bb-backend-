import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface DonationDetails {
  donorName: string;
  donorId: string;
  donorEmail: string;
  donorPhone: string;
  donorBloodType: string;
  donorAge: number;
  bloodBankName: string;
  bloodBankAddress: string;
  donationDate: Date;
  numberOfUnits: number;
  bloodUnits: Array<{
    id: string;
    unitNumber: string;
    barcode: string;
    volume: number;
    expiryDate: Date;
  }>;
  donationRequestId: string;
  urgencyLevel?: string;
  patientBloodType: string;
}

class PDFService {
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async generateDonationCertificate(
    donationDetails: DonationDetails
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF directory if it doesn't exist
        const pdfDir = path.join(process.cwd(), "generated-pdfs");
        this.ensureDirectoryExists(pdfDir);

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `donation-certificate-${donationDetails.donorId}-${timestamp}.pdf`;
        const filepath = path.join(pdfDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Add header
        this.addHeader(doc, donationDetails);

        // Add donor information
        this.addDonorInfo(doc, donationDetails);

        // Add donation details
        this.addDonationDetails(doc, donationDetails);

        // Add blood units table
        this.addBloodUnitsTable(doc, donationDetails);

        // Add footer
        this.addFooter(doc, donationDetails);

        // Finalize PDF
        doc.end();

        stream.on("finish", () => {
          resolve(filepath);
        });

        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, details: DonationDetails): void {
    // Add logo/header section
    doc
      .fontSize(24)
      .fillColor("#d32f2f")
      .text("BLOOD DONATION CERTIFICATE", 50, 50, { align: "center" });

    doc
      .fontSize(16)
      .fillColor("#333")
      .text("Official Donation Record", 50, 85, { align: "center" });

    // Add blood bank info
    doc
      .fontSize(14)
      .fillColor("#666")
      .text(details.bloodBankName, 50, 120, { align: "center" })
      .text(details.bloodBankAddress, 50, 140, { align: "center" });

    // Add horizontal line
    doc
      .moveTo(50, 170)
      .lineTo(550, 170)
      .strokeColor("#d32f2f")
      .lineWidth(2)
      .stroke();

    doc.moveDown(2);
  }

  private addDonorInfo(
    doc: PDFKit.PDFDocument,
    details: DonationDetails
  ): void {
    const startY = 200;

    doc.fontSize(16).fillColor("#d32f2f").text("DONOR INFORMATION", 50, startY);

    const infoY = startY + 30;
    doc.fontSize(12).fillColor("#333");

    // Left column
    doc
      .text("Donor Name:", 50, infoY)
      .text("Donor ID:", 50, infoY + 20)
      .text("Blood Type:", 50, infoY + 40)
      .text("Age:", 50, infoY + 60);

    // Right column (values)
    doc
      .text(details.donorName, 150, infoY)
      .text(details.donorId, 150, infoY + 20)
      .text(details.donorBloodType, 150, infoY + 40)
      .text(details.donorAge.toString() + " years", 150, infoY + 60);

    // Right side contact info
    doc
      .text("Email:", 300, infoY)
      .text("Phone:", 300, infoY + 20)
      .text("Donation Date:", 300, infoY + 40)
      .text("Urgency Level:", 300, infoY + 60);

    doc
      .text(details.donorEmail, 380, infoY)
      .text(details.donorPhone, 380, infoY + 20)
      .text(this.formatDate(details.donationDate), 380, infoY + 40)
      .text(details.urgencyLevel?.toUpperCase() || "MEDIUM", 380, infoY + 60);
  }

  private addDonationDetails(
    doc: PDFKit.PDFDocument,
    details: DonationDetails
  ): void {
    const startY = 320;

    doc.fontSize(16).fillColor("#d32f2f").text("DONATION DETAILS", 50, startY);

    const detailsY = startY + 30;
    doc.fontSize(12).fillColor("#333");

    // Donation summary box
    doc.rect(50, detailsY, 500, 80).strokeColor("#ddd").lineWidth(1).stroke();

    doc
      .text("Total Units Donated:", 70, detailsY + 15)
      .fontSize(14)
      .fillColor("#d32f2f")
      .text(details.numberOfUnits.toString() + " Units", 200, detailsY + 15);

    doc
      .fontSize(12)
      .fillColor("#333")
      .text("Total Volume:", 70, detailsY + 35)
      .text(details.numberOfUnits * 450 + " ml", 200, detailsY + 35);

    doc
      .text("Patient Blood Type:", 300, detailsY + 15)
      .text("Donation Request ID:", 300, detailsY + 35);

    doc
      .text(details.patientBloodType, 430, detailsY + 15)
      .text(details.donationRequestId.slice(-8), 430, detailsY + 35);

    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        "This donation will help save lives. Thank you for your generous contribution!",
        70,
        detailsY + 55
      );
  }

  private addBloodUnitsTable(
    doc: PDFKit.PDFDocument,
    details: DonationDetails
  ): void {
    const startY = 450;

    doc
      .fontSize(16)
      .fillColor("#d32f2f")
      .text("INDIVIDUAL BLOOD UNITS", 50, startY);

    // Table headers
    const tableY = startY + 30;
    const rowHeight = 25;

    doc.fontSize(10).fillColor("#fff");

    // Header background
    doc.rect(50, tableY, 500, rowHeight).fill("#d32f2f");

    // Header text
    doc
      .text("Unit #", 60, tableY + 8)
      .text("Unit ID", 120, tableY + 8)
      .text("Barcode", 220, tableY + 8)
      .text("Volume (ml)", 320, tableY + 8)
      .text("Expiry Date", 410, tableY + 8);

    // Table rows
    doc.fillColor("#333");
    details.bloodUnits.forEach((unit, index) => {
      const rowY = tableY + rowHeight + index * rowHeight;

      // Alternate row background
      if (index % 2 === 1) {
        doc.rect(50, rowY, 500, rowHeight).fill("#f9f9f9");
      }

      doc
        .text(unit.unitNumber, 60, rowY + 8)
        .text(unit.id.slice(-8), 120, rowY + 8)
        .text(unit.barcode || "N/A", 220, rowY + 8)
        .text(unit.volume.toString(), 320, rowY + 8)
        .text(this.formatDate(unit.expiryDate), 410, rowY + 8);
    });

    // Table border
    const tableHeight = rowHeight * (details.bloodUnits.length + 1);
    doc
      .rect(50, tableY, 500, tableHeight)
      .strokeColor("#ddd")
      .lineWidth(1)
      .stroke();
  }

  private addFooter(doc: PDFKit.PDFDocument, details: DonationDetails): void {
    const footerY = 650;

    // Thank you message
    doc
      .fontSize(14)
      .fillColor("#d32f2f")
      .text("Thank you for saving lives!", 50, footerY, { align: "center" });

    // Important notes
    doc
      .fontSize(10)
      .fillColor("#666")
      .text("Important Notes:", 50, footerY + 30)
      .text(
        "• Please maintain a healthy diet and stay hydrated",
        50,
        footerY + 45
      )
      .text(
        "• Wait at least 56 days before your next whole blood donation",
        50,
        footerY + 60
      )
      .text(
        "• Contact us immediately if you experience any health issues",
        50,
        footerY + 75
      );

    // Certificate validation
    doc
      .text(
        "Certificate Generated: " + this.formatDateTime(new Date()),
        50,
        footerY + 100
      )
      .text(
        "This is a computer-generated document and does not require signature.",
        50,
        footerY + 115
      );

    // QR code placeholder (you can implement QR code generation later)
    doc
      .rect(450, footerY + 90, 80, 80)
      .strokeColor("#ddd")
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(8)
      .text("QR Code", 475, footerY + 125)
      .text("(Verification)", 465, footerY + 135);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default new PDFService();
