# Blood Donation Management System API

This document describes the enhanced blood donation management system that tracks donations from pending status to success, and manages individual blood units with their complete history.

## Overview

The system now includes:
1. **Donation Status Management**: Donations start as "pending" and change to "success" when blood banks accept them
2. **Individual Blood Unit Tracking**: Each unit of blood (450ml bag) is tracked separately with complete history
3. **Flexible Allocation**: Support for allocating multiple units to different patients
4. **Inventory Management**: Real-time blood inventory tracking with expiry management

## Key Design Decision: Individual Unit Tracking

**Why Individual Units?**
- **Scenario**: Donor gives 3 units → Patient A needs 1 unit, Patient B needs 2 units
- **Solution**: Each physical blood bag (unit) gets its own record in the database
- **Benefits**: Perfect traceability, flexible distribution, compliance with medical standards

## Database Schema

### DonationRequest Table
- `id`: Unique identifier
- `status`: pending → success (when accepted) | rejected
- `donorId`, `donor`: Donor information
- `bloodBankId`, `bloodBank`: Blood bank information
- `patientId`: Patient requesting blood
- `donorBloodType`, `patientBloodType`: Blood type matching
- `urgencyLevel`: low, medium, high, critical
- `requiredUnits`: Number of units needed
- `notes`: Additional information
- `preferredDate`: Preferred donation date
- `approvedAt`: When donation was approved
- `bloodUnits`: Related individual blood units created

### BloodUnit Table (Individual Unit Tracking)
- `id`: Unique identifier
- `unitNumber`: Sequential number for this donation (1, 2, 3...)
- `donationRequestId`: Links to original donation request
- `donorId`, `donorName`, `donorBloodType`: Donor details
- `bloodBankId`, `bloodBankName`: Blood bank that collected
- `donationDate`: When blood was donated
- `expiryDate`: When blood expires (typically 35 days)
- `volume`: Volume in ml (standard 450ml)
- `barcode`: Physical barcode for tracking
- `status`: available → used | expired | discarded
- `usedAt`: When blood was given to patient
- `patientUsedFor`: Patient who received the blood
- `notes`: Additional information

## API Endpoints

### 1. Accept Donation (Blood Banks)
**POST** `/donations/accept`

Accept a pending donation request and create individual blood unit records.

```json
{
  "donationRequestId": "uuid",
  "numberOfUnits": 3,
  "notes": "Optional notes",
  "expiryDays": 35
}
```

**Response:**
```json
{
  "success": true,
  "message": "Donation accepted successfully and 3 individual blood units created.",
  "data": {
    "donationRequest": {...},
    "bloodUnits": [
      {
        "id": "unit-1-id",
        "unitNumber": "1",
        "barcode": "BloodBank-ABC12345-1",
        "volume": 450,
        "status": "available"
      },
      {
        "id": "unit-2-id", 
        "unitNumber": "2",
        "barcode": "BloodBank-ABC12345-2",
        "volume": 450,
        "status": "available"
      },
      {
        "id": "unit-3-id",
        "unitNumber": "3", 
        "barcode": "BloodBank-ABC12345-3",
        "volume": 450,
        "status": "available"
      }
    ],
    "totalUnitsCreated": 3
  }
}
```

### 2. Use Single Blood Unit
**PUT** `/donations/blood-units/use`

Mark a specific blood unit as used for a patient.

```json
{
  "bloodUnitId": "unit-1-id",
  "patientId": "patient-uuid",
  "notes": "Given for emergency surgery"
}
```

### 3. Allocate Multiple Blood Units (Bulk Allocation)
**POST** `/donations/blood-units/allocate`

Allocate multiple blood units to a patient automatically (FIFO - oldest units first).

```json
{
  "patientId": "patient-uuid",
  "bloodType": "A+",
  "unitsNeeded": 2,
  "notes": "Surgery requiring 2 units"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully allocated 2 blood units to patient.",
  "data": {
    "patientId": "patient-uuid",
    "bloodType": "A+",
    "unitsAllocated": 2,
    "units": [
      {
        "id": "unit-1-id",
        "unitNumber": "1",
        "barcode": "BloodBank-ABC12345-1",
        "status": "used",
        "usedAt": "2025-01-15T10:30:00Z"
      },
      {
        "id": "unit-5-id",
        "unitNumber": "2", 
        "barcode": "BloodBank-DEF67890-2",
        "status": "used",
        "usedAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

### 4. Get Blood Units (Blood Banks)
**GET** `/donations/blood-units?status=available`

Retrieve all individual blood units for the authenticated blood bank.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "unit-1-id",
      "unitNumber": "1",
      "donorBloodType": "A+",
      "volume": 450,
      "status": "available",
      "barcode": "BloodBank-ABC12345-1",
      "expiryDate": "2025-02-15T00:00:00Z",
      "donationDate": "2025-01-15T00:00:00Z"
    }
  ],
  "summary": {
    "total": 10,
    "available": 7,
    "used": 2,
    "expired": 1,
    "byBloodType": {
      "A+": 3,
      "O+": 4,
      "B+": 2,
      "AB+": 1
    }
  }
}
```

### 5. Blood Inventory Summary
**GET** `/donations/inventory`

Get comprehensive blood inventory summary by blood type.

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory": {
      "A+": {
        "total": 5,
        "available": 3,
        "used": 1,
        "expired": 1,
        "expiringSoon": 1
      }
    },
    "totalAvailable": 15,
    "totalExpired": 3,
    "totalUsed": 8
  }
}
```

## Real-World Scenario Example

### Scenario: Donor gives 3 units, distributed to 2 patients

1. **Donor Donation Request**: 
   - Donor requests to donate 3 units
   - Status: "pending"

2. **Blood Bank Accepts**:
   ```json
   POST /donations/accept
   {
     "donationRequestId": "donation-123",
     "numberOfUnits": 3
   }
   ```
   - Creates 3 individual BloodUnit records
   - Each unit gets unique ID and barcode
   - Status changes to "success"

3. **Patient A needs 1 unit**:
   ```json
   POST /donations/blood-units/allocate
   {
     "patientId": "patient-A",
     "bloodType": "A+",
     "unitsNeeded": 1
   }
   ```
   - Allocates oldest available unit to Patient A
   - Unit status: "available" → "used"

4. **Patient B needs 2 units**:
   ```json
   POST /donations/blood-units/allocate
   {
     "patientId": "patient-B", 
     "bloodType": "A+",
     "unitsNeeded": 2
   }
   ```
   - Allocates remaining 2 units to Patient B
   - Both units status: "available" → "used"

5. **Final State**:
   - Original donation: Status "success"
   - Unit 1: Used by Patient A
   - Unit 2: Used by Patient B  
   - Unit 3: Used by Patient B
   - Complete traceability maintained

## Workflow

### 1. Donation Request Flow
1. **Donor creates donation request** → Status: "pending"
2. **Blood bank reviews request** → Can accept or reject
3. **If accepted** → Status: "success" + Blood unit created
4. **If rejected** → Status: "rejected"

### 2. Blood Unit Lifecycle
1. **Created** → Status: "available"
2. **Given to patient** → Status: "used"
3. **Past expiry date** → Status: "expired"
4. **Damaged/contaminated** → Status: "discarded"

### 3. Blood Unit History Tracking
Each blood unit maintains complete history:
- Original donor information
- Donation request details
- Collection date and blood bank
- Expiry date (calculated based on donation date)
- Usage information (patient, date used)
- Current status

## Blood Expiry Management

- **Default expiry**: 35 days from donation date
- **Expiry tracking**: Automatic identification of expired units
- **Expiring soon**: Units expiring within 7 days
- **Batch expiry updates**: Mass update of expired units

## Authentication

All endpoints require authentication via JWT token in cookies:
- Blood banks can only manage their own donations and blood units
- Tokens are validated using the existing `authMiddleware`

## Error Handling

The API provides comprehensive error handling:
- **400**: Invalid input data (Zod validation)
- **401**: Unauthorized access
- **404**: Resource not found
- **409**: Conflict (duplicate requests)
- **500**: Internal server error

## Status Codes

### Donation Request Status
- `pending`: Waiting for blood bank approval
- `success`: Accepted by blood bank, blood collected
- `rejected`: Rejected by blood bank
- `cancelled`: Cancelled by donor

### Blood Unit Status
- `available`: Ready for use
- `used`: Given to a patient
- `expired`: Past expiry date
- `discarded`: Damaged or contaminated

## Usage Examples

### Blood Bank Accepting a Donation
```bash
curl -X POST /donations/accept \
  -H "Content-Type: application/json" \
  -d '{
    "donationRequestId": "123e4567-e89b-12d3-a456-426614174000",
    "numberOfUnits": 2,
    "notes": "Healthy donor, good quality blood"
  }'
```

### Checking Blood Inventory
```bash
curl -X GET /donations/inventory
```

### Using Blood for Patient
```bash
curl -X PUT /donations/blood-units/use \
  -H "Content-Type: application/json" \
  -d '{
    "bloodUnitId": "123e4567-e89b-12d3-a456-426614174001",
    "patientId": "123e4567-e89b-12d3-a456-426614174002",
    "notes": "Emergency surgery - Type A+ blood used"
  }'
```

This enhanced system provides complete traceability of blood donations from request to usage, ensuring better inventory management and patient safety.
