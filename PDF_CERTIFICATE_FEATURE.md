# Blood Donation PDF Certificate Feature

## Overview

When a donor successfully donates blood (blood bank accepts the donation), they automatically receive a **PDF certificate** containing all the details of their donation. This serves as:

- **Proof of donation** for personal records
- **Medical documentation** for future reference
- **Thank you certificate** acknowledging their contribution

## Features

### 🎯 **Automatic PDF Generation**
- PDF is generated automatically when blood bank accepts donation
- Contains complete donation details and blood unit information
- Professional medical certificate format

### 📄 **Certificate Contents**
- **Donor Information**: Name, ID, blood type, age, contact details
- **Blood Bank Details**: Name, address, collection date
- **Donation Summary**: Number of units, total volume, urgency level
- **Individual Blood Units**: Each unit with barcode, expiry date, volume
- **Patient Information**: Blood type needed
- **Certificate Validation**: Generation timestamp, unique identifiers

### 🔗 **Download System**
- Donors can download their certificates anytime
- Secure access (donors can only access their own certificates)
- Clean filename generation
- Automatic cleanup of temporary files

## API Endpoints

### 1. Accept Donation (Generates PDF)
**POST** `/donations/accept`

When blood bank accepts a donation, PDF is automatically generated:

```json
{
  "donationRequestId": "uuid",
  "numberOfUnits": 2,
  "notes": "Healthy donor, good quality blood"
}
```

**Response includes PDF path:**
```json
{
  "success": true,
  "message": "Donation accepted successfully and 2 individual blood units created. PDF certificate generated.",
  "data": {
    "donationRequest": {...},
    "bloodUnits": [...],
    "totalUnitsCreated": 2,
    "certificatePDF": "/path/to/certificate.pdf"
  }
}
```

### 2. Download Certificate
**GET** `/donations/certificate/:donationRequestId/download`

Donors can download their certificate:
- Requires authentication (donor must be logged in)
- Only allows downloading own certificates
- Returns PDF file for download

### 3. Get Donation History
**GET** `/donations/my-donations`

Get donor's complete donation history with download links:

```json
{
  "success": true,
  "data": {
    "totalDonations": 3,
    "totalUnits": 6,
    "totalVolume": 2700,
    "donations": [
      {
        "donationId": "uuid",
        "donationDate": "2025-01-15T10:30:00Z",
        "bloodType": "A+",
        "bloodBank": "City Blood Bank",
        "unitsCount": 2,
        "totalVolume": 900,
        "unitsUsed": 2,
        "urgencyLevel": "high",
        "certificateDownloadUrl": "/donations/certificate/uuid/download"
      }
    ]
  }
}
```

## PDF Certificate Layout

### 📋 **Header Section**
```
🩸 BLOOD DONATION CERTIFICATE
Official Donation Record

[Blood Bank Name]
[Blood Bank Address]
```

### 👤 **Donor Information**
```
DONOR INFORMATION
Donor Name: John Doe               Email: john@email.com
Donor ID: donor-uuid-123          Phone: +1-555-0123
Blood Type: A+                    Donation Date: January 15, 2025
Age: 28 years                     Urgency Level: HIGH
```

### 🩸 **Donation Details**
```
DONATION DETAILS
┌─────────────────────────────────────────────────┐
│ Total Units Donated: 2 Units                   │
│ Total Volume: 900 ml                            │
│ Patient Blood Type: A+                          │
│ Donation Request ID: ABC12345                   │
│                                                 │
│ This donation will help save lives.            │
│ Thank you for your generous contribution!       │
└─────────────────────────────────────────────────┘
```

### 📊 **Individual Blood Units Table**
```
INDIVIDUAL BLOOD UNITS
┌─────────────────────────────────────────────────┐
│ Unit# │ Unit ID   │ Barcode      │ Vol │ Expiry │
├─────────────────────────────────────────────────┤
│   1   │ ABC12345  │ BB-XYZ-1     │ 450 │ Feb 19 │
│   2   │ DEF67890  │ BB-XYZ-2     │ 450 │ Feb 19 │
└─────────────────────────────────────────────────┘
```

### 🙏 **Footer Section**
```
Thank you for saving lives! 💝

Important Notes:
• Please maintain a healthy diet and stay hydrated
• Wait at least 56 days before your next whole blood donation  
• Contact us immediately if you experience any health issues

Certificate Generated: January 15, 2025 at 10:30 AM
This is a computer-generated document and does not require signature.

[QR Code Placeholder]
```

## Technical Implementation

### 📦 **Dependencies**
- `pdfkit`: PDF generation library
- `@types/pdfkit`: TypeScript definitions
- `fs`: File system operations
- `path`: File path utilities

### 🏗️ **Architecture**

```
📁 services/
  └── pdf.service.ts          # PDF generation logic

📁 controllers/
  ├── acceptDonation.controllers.ts    # Triggers PDF generation
  └── donationCertificate.controllers.ts    # Download & history

📁 routes/
  └── acceptDonation.routes.ts        # Certificate routes

📁 generated-pdfs/
  └── [temporary PDF files]           # Auto-cleaned
```

### 🔒 **Security**
- **Authentication Required**: All endpoints require login
- **Authorization**: Donors can only access their own certificates
- **File Cleanup**: Temporary PDFs deleted after download
- **Input Validation**: Zod schema validation

## Usage Examples

### For Blood Banks
```bash
# Accept donation (triggers PDF generation)
curl -X POST /donations/accept \
  -H "Content-Type: application/json" \
  -d '{
    "donationRequestId": "donation-123",
    "numberOfUnits": 2,
    "notes": "Regular healthy donor"
  }'
```

### For Donors
```bash
# Get donation history
curl -X GET /donations/my-donations

# Download specific certificate
curl -X GET /donations/certificate/donation-123/download \
  -o "my-donation-certificate.pdf"
```

## File Management

### 📂 **Storage**
- PDFs stored in `generated-pdfs/` directory
- Unique filename with timestamp
- Temporary storage (cleaned after download)

### 🧹 **Cleanup**
- Files automatically deleted 5 seconds after streaming
- Prevents disk space issues
- Maintains system performance

## Benefits

### For Donors
- **Official documentation** of their donation
- **Personal records** for medical history
- **Pride and satisfaction** with beautiful certificate
- **Accessibility** - download anytime

### For Blood Banks
- **Professional service** increases donor satisfaction
- **Reduced paperwork** - automated certificate generation
- **Better donor retention** through professional experience
- **Audit trail** - complete documentation

### For System
- **Compliance** with medical documentation requirements
- **Traceability** - links certificates to specific donations
- **Professionalism** - enhances system credibility

## Error Handling

- **PDF Generation Fails**: Donation still succeeds, user notified
- **File Not Found**: Regenerate certificate on download
- **Unauthorized Access**: Block download attempts
- **Storage Issues**: Fallback to temporary storage

This PDF certificate feature adds significant value to the blood donation system by providing donors with professional documentation of their life-saving contributions! 🩸📜
