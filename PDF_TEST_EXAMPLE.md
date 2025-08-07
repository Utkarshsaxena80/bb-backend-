# Test Example: PDF Certificate Generation

## Test Scenario

A donor named "John Doe" donates 2 units of A+ blood to help a patient.

## Step 1: Blood Bank Accepts Donation

**Request:**

```bash
POST /donations/accept
{
  "donationRequestId": "12345678-1234-1234-1234-123456789012",
  "numberOfUnits": 2,
  "notes": "Healthy regular donor, excellent vitals"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Donation accepted successfully and 2 individual blood units created. PDF certificate generated.",
  "data": {
    "donationRequest": {
      "id": "12345678-1234-1234-1234-123456789012",
      "status": "success",
      "donor": "John Doe",
      "donorBloodType": "A+",
      "bloodBank": "City General Blood Bank",
      "createdAt": "2025-08-06T14:30:00.000Z"
    },
    "bloodUnits": [
      {
        "id": "unit-1-uuid",
        "unitNumber": "1",
        "barcode": "City-General-12345678-1",
        "volume": 450,
        "status": "available",
        "expiryDate": "2025-09-10T14:30:00.000Z"
      },
      {
        "id": "unit-2-uuid",
        "unitNumber": "2",
        "barcode": "City-General-12345678-2",
        "volume": 450,
        "status": "available",
        "expiryDate": "2025-09-10T14:30:00.000Z"
      }
    ],
    "totalUnitsCreated": 2,
    "certificatePDF": "/path/to/generated-pdfs/donation-certificate-donor-uuid-2025-08-06T14-30-00.pdf"
  }
}
```

## Step 2: Generated PDF Certificate Contents

The generated PDF would contain:

```
BLOOD DONATION CERTIFICATE
Official Donation Record

City General Blood Bank
123 Medical Center Drive, Downtown

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DONOR INFORMATION
Donor Name: John Doe                    Email: john.doe@email.com
Donor ID: donor-uuid-789               Phone: +1-555-0198
Blood Type: A+                         Donation Date: August 6, 2025
Age: 32 years                          Urgency Level: MEDIUM

DONATION DETAILS
┌─────────────────────────────────────────────────────────────┐
│ Total Units Donated: 2 Units                                │
│ Total Volume: 900 ml                                        │
│ Patient Blood Type: A+                                      │
│ Donation Request ID: 12345678                               │
│                                                             │
│ This donation will help save lives.                         │
│ Thank you for your generous contribution!                   │
└─────────────────────────────────────────────────────────────┘

INDIVIDUAL BLOOD UNITS
┌──────────────────────────────────────────────────────────────────┐
│ Unit# │ Unit ID      │ Barcode              │ Vol │ Expiry Date  │
├──────────────────────────────────────────────────────────────────┤
│   1   │ unit-1-uuid  │ City-General-123-1   │ 450 │ Sep 10, 25   │
│   2   │ unit-2-uuid  │ City-General-123-2   │ 450 │ Sep 10, 25   │
└──────────────────────────────────────────────────────────────────┘

Important Notes:
• Please maintain a healthy diet and stay hydrated
• Wait at least 56 days before your next whole blood donation
• Contact us immediately if you experience any health issues

Certificate Generated: August 6, 2025 at 2:30 PM
This is a computer-generated document and does not require signature.

                                                           [QR Code]
                                                        (Verification)
```

## Step 3: Donor Downloads Certificate

**Request:**

```bash
GET /donations/certificate/12345678-1234-1234-1234-123456789012/download
```

**Response:**

- Content-Type: application/pdf
- Content-Disposition: attachment; filename="donation-certificate-John-Doe-2025-08-06.pdf"
- File streams as PDF download

## Step 4: Donor Views History

**Request:**

```bash
GET /donations/my-donations
```

**Response:**

```json
{
  "success": true,
  "message": "Donation history retrieved successfully.",
  "data": {
    "totalDonations": 3,
    "totalUnits": 7,
    "totalVolume": 3150,
    "donations": [
      {
        "donationId": "12345678-1234-1234-1234-123456789012",
        "donationDate": "2025-08-06T14:30:00.000Z",
        "bloodType": "A+",
        "bloodBank": "City General Blood Bank",
        "unitsCount": 2,
        "totalVolume": 900,
        "unitsUsed": 0,
        "urgencyLevel": "medium",
        "certificateDownloadUrl": "/donations/certificate/12345678-1234-1234-1234-123456789012/download"
      },
      {
        "donationId": "previous-donation-uuid",
        "donationDate": "2025-06-15T09:00:00.000Z",
        "bloodType": "A+",
        "bloodBank": "Metro Blood Center",
        "unitsCount": 3,
        "totalVolume": 1350,
        "unitsUsed": 3,
        "urgencyLevel": "high",
        "certificateDownloadUrl": "/donations/certificate/previous-donation-uuid/download"
      }
    ]
  }
}
```

## Key Benefits Demonstrated

1. **Automatic Generation**: PDF created instantly when donation accepted
2. **Complete Information**: All donation details included in certificate
3. **Individual Unit Tracking**: Each blood bag tracked with unique barcode
4. **Professional Format**: Medical-grade certificate suitable for records
5. **Easy Access**: Donors can download anytime via API
6. **History Tracking**: Complete donation history with certificate links
7. **Security**: Only donors can access their own certificates

This system provides donors with a professional, comprehensive record of their life-saving contributions!
