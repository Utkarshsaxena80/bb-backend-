# Blood Bank Management System - API Endpoints & Tests

## Overview

This document provides complete information about all available API endpoints in the Blood Bank Management System, including request/response examples, authentication requirements, and test cases.

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require authentication via JWT token stored in cookies. Use the `authMiddleware` for protected routes.

---

## 📋 Patient Management

### 1. Patient Registration
**POST** `/patient/register`

Register a new patient in the system.

**Request Body:**
```json
{
  "name": "John Patient",
  "email": "john.patient@email.com",
  "password": "securePassword123",
  "phone": "+1-555-0123",
  "BloodBank": "City General Blood Bank",
  "BloodType": "A+",
  "city": "New York",
  "state": "NY",
  "age": 35
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "id": "patient-uuid",
    "name": "John Patient",
    "email": "john.patient@email.com",
    "BloodType": "A+",
    "city": "New York"
  }
}
```

**Test Example:**
```bash
curl -X POST http://localhost:3000/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test.patient@email.com",
    "password": "password123",
    "phone": "+1-555-0199",
    "BloodBank": "Test Blood Bank",
    "BloodType": "O+",
    "city": "Test City",
    "state": "TC",
    "age": 30
  }'
```

### 2. Get All Patients
**GET** `/patients`

Retrieve all patients (requires authentication).

**Response:**
```json
{
  "message": "all data fetched successfully",
  "patients": [
    {
      "name": "John Patient",
      "email": "john.patient@email.com",
      "phone": "+1-555-0123",
      "BloodBank": "City General Blood Bank",
      "BloodType": "A+",
      "city": "New York",
      "state": "NY",
      "age": 35
    }
  ]
}
```

**Test Example:**
```bash
curl -X GET http://localhost:3000/patients \
  -H "Cookie: authToken=your-jwt-token"
```

---

## 🩸 Donor Management

### 3. Donor Registration
**POST** `/donor/register`

Register a new blood donor.

**Request Body:**
```json
{
  "name": "Jane Donor",
  "email": "jane.donor@email.com",
  "password": "securePassword123",
  "phone": "+1-555-0124",
  "BloodBank": "City General Blood Bank",
  "BloodType": "A+",
  "city": "New York",
  "state": "NY",
  "age": 28
}
```

**Test Example:**
```bash
curl -X POST http://localhost:3000/donor/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Donor",
    "email": "test.donor@email.com",
    "password": "password123",
    "phone": "+1-555-0198",
    "BloodBank": "Test Blood Bank",
    "BloodType": "A+",
    "city": "Test City",
    "state": "TC",
    "age": 25
  }'
```

---

## 🏥 Blood Bank Management

### 4. Blood Bank Registration
**POST** `/bloodbank/register`

Register a new blood bank.

**Request Body:**
```json
{
  "name": "Metro Blood Center",
  "adminName": "Dr. Smith",
  "licenseNumber": "BB-2025-001",
  "email": "admin@metrobbank.com",
  "password": "securePassword123",
  "phone": "+1-555-0125",
  "totalBloodBags": 1000,
  "address": "123 Medical Drive",
  "city": "New York",
  "state": "NY"
}
```

**Test Example:**
```bash
curl -X POST http://localhost:3000/bloodbank/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Blood Bank",
    "adminName": "Test Admin",
    "licenseNumber": "TEST-001",
    "email": "admin@testbb.com",
    "password": "password123",
    "phone": "+1-555-0197",
    "totalBloodBags": 500,
    "address": "123 Test Street",
    "city": "Test City",
    "state": "TC"
  }'
```

---

## 💉 Donation Management

### 5. Create Donation Request
**POST** `/donate` (requires donor authentication)

Create a new donation request.

**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "urgencyLevel": "high",
  "requiredUnits": 2,
  "notes": "Emergency surgery required",
  "preferredDate": "2025-08-10T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Donation request submitted successfully.",
  "data": {
    "requestId": "donation-request-uuid",
    "donor": {
      "id": "donor-uuid",
      "name": "Jane Donor",
      "bloodType": "A+",
      "city": "New York"
    },
    "patient": {
      "id": "patient-uuid",
      "name": "John Patient",
      "bloodType": "A+"
    }
  }
}
```

**Test Example:**
```bash
curl -X POST http://localhost:3000/donate \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=donor-jwt-token" \
  -d '{
    "patientId": "patient-uuid",
    "urgencyLevel": "medium",
    "requiredUnits": 1,
    "notes": "Routine donation"
  }'
```

### 6. Accept Donation (Blood Bank)
**POST** `/donations/accept` (requires blood bank authentication)

Accept a pending donation request and create blood units with PDF certificate.

**Request Body:**
```json
{
  "donationRequestId": "donation-request-uuid",
  "numberOfUnits": 2,
  "notes": "Healthy donor, good quality blood",
  "expiryDays": 35
}
```

**Response:**
```json
{
  "success": true,
  "message": "Donation accepted successfully and 2 individual blood units created. PDF certificate generated.",
  "data": {
    "donationRequest": {
      "id": "donation-request-uuid",
      "status": "success",
      "donor": "Jane Donor",
      "donorBloodType": "A+"
    },
    "bloodUnits": [
      {
        "id": "blood-unit-1-uuid",
        "unitNumber": "1",
        "barcode": "TestBank-12345678-1",
        "volume": 450,
        "status": "available",
        "expiryDate": "2025-09-10T14:30:00.000Z"
      },
      {
        "id": "blood-unit-2-uuid",
        "unitNumber": "2",
        "barcode": "TestBank-12345678-2",
        "volume": 450,
        "status": "available",
        "expiryDate": "2025-09-10T14:30:00.000Z"
      }
    ],
    "totalUnitsCreated": 2,
    "certificatePDF": "/path/to/certificate.pdf"
  }
}
```

**Test Example:**
```bash
curl -X POST http://localhost:3000/donations/accept \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=bloodbank-jwt-token" \
  -d '{
    "donationRequestId": "donation-request-uuid",
    "numberOfUnits": 1,
    "notes": "Regular donation acceptance"
  }'
```

### 7. Reject Donation (Blood Bank)
**PUT** `/donations/reject/:donationRequestId` (requires blood bank authentication)

Reject a pending donation request.

**Request Body:**
```json
{
  "reason": "Donor health concerns detected"
}
```

**Test Example:**
```bash
curl -X PUT http://localhost:3000/donations/reject/donation-request-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=bloodbank-jwt-token" \
  -d '{
    "reason": "Medical eligibility issues"
  }'
```

### 8. Get Donation Requests (Blood Bank)
**GET** `/getDonations` (requires blood bank authentication)

Get all donation requests for a blood bank.

**Response:**
```json
{
  "success": true,
  "message": "Donation requests retrieved successfully.",
  "data": [
    {
      "id": "donation-request-uuid",
      "donor": "Jane Donor",
      "donorBloodType": "A+",
      "patientBloodType": "A+",
      "status": "pending",
      "urgencyLevel": "high",
      "requiredUnits": 2,
      "createdAt": "2025-08-06T10:00:00Z"
    }
  ],
  "count": 1,
  "summary": {
    "pending": 1,
    "success": 5,
    "approved": 3,
    "completed": 2,
    "cancelled": 0,
    "rejected": 1
  }
}
```

**Test Example:**
```bash
curl -X GET http://localhost:3000/getDonations \
  -H "Cookie: authToken=bloodbank-jwt-token"
```

---

## 🩸 Blood Unit Management

### 9. Get Blood Units (Blood Bank)
**GET** `/donations/blood-units?status=available` (requires blood bank authentication)

Get all blood units for a blood bank, optionally filtered by status.

**Query Parameters:**
- `status` (optional): `available`, `used`, `expired`, `discarded`

**Response:**
```json
{
  "success": true,
  "message": "Blood units retrieved successfully.",
  "data": [
    {
      "id": "blood-unit-uuid",
      "unitNumber": "1",
      "donorBloodType": "A+",
      "volume": 450,
      "status": "available",
      "barcode": "TestBank-12345678-1",
      "expiryDate": "2025-09-10T00:00:00Z",
      "donationDate": "2025-08-06T10:00:00Z"
    }
  ],
  "summary": {
    "total": 10,
    "available": 7,
    "used": 2,
    "expired": 1,
    "discarded": 0,
    "byBloodType": {
      "A+": 3,
      "O+": 4,
      "B+": 2,
      "AB+": 1
    }
  }
}
```

**Test Example:**
```bash
curl -X GET "http://localhost:3000/donations/blood-units?status=available" \
  -H "Cookie: authToken=bloodbank-jwt-token"
```

### 10. Use Single Blood Unit
**PUT** `/donations/blood-units/use` (requires blood bank authentication)

Mark a specific blood unit as used for a patient.

**Request Body:**
```json
{
  "bloodUnitId": "blood-unit-uuid",
  "patientId": "patient-uuid",
  "notes": "Given for emergency surgery"
}
```

**Test Example:**
```bash
curl -X PUT http://localhost:3000/donations/blood-units/use \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=bloodbank-jwt-token" \
  -d '{
    "bloodUnitId": "blood-unit-uuid",
    "patientId": "patient-uuid",
    "notes": "Emergency transfusion"
  }'
```

### 11. Allocate Multiple Blood Units
**POST** `/donations/blood-units/allocate` (requires blood bank authentication)

Allocate multiple blood units to a patient (FIFO - oldest first).

**Request Body:**
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
        "id": "unit-1-uuid",
        "unitNumber": "1",
        "barcode": "TestBank-ABC12345-1",
        "status": "used",
        "usedAt": "2025-08-06T15:30:00Z"
      },
      {
        "id": "unit-2-uuid",
        "unitNumber": "2",
        "barcode": "TestBank-DEF67890-2",
        "status": "used",
        "usedAt": "2025-08-06T15:30:00Z"
      }
    ]
  }
}
```

**Test Example:**
```bash
curl -X POST http://localhost:3000/donations/blood-units/allocate \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=bloodbank-jwt-token" \
  -d '{
    "patientId": "patient-uuid",
    "bloodType": "O+",
    "unitsNeeded": 3,
    "notes": "Major surgery - 3 units required"
  }'
```

### 12. Mark Expired Blood Units
**PUT** `/donations/blood-units/mark-expired` (requires blood bank authentication)

Automatically mark all expired blood units as expired.

**Response:**
```json
{
  "success": true,
  "message": "3 blood units marked as expired.",
  "data": {
    "expiredCount": 3
  }
}
```

**Test Example:**
```bash
curl -X PUT http://localhost:3000/donations/blood-units/mark-expired \
  -H "Cookie: authToken=bloodbank-jwt-token"
```

### 13. Get Blood Inventory
**GET** `/donations/inventory` (requires blood bank authentication)

Get comprehensive blood inventory summary by blood type.

**Response:**
```json
{
  "success": true,
  "message": "Blood inventory retrieved successfully.",
  "data": {
    "inventory": {
      "A+": {
        "total": 5,
        "available": 3,
        "used": 1,
        "expired": 1,
        "expiringSoon": 1
      },
      "O+": {
        "total": 8,
        "available": 6,
        "used": 2,
        "expired": 0,
        "expiringSoon": 2
      }
    },
    "totalAvailable": 15,
    "totalExpired": 3,
    "totalUsed": 8
  }
}
```

**Test Example:**
```bash
curl -X GET http://localhost:3000/donations/inventory \
  -H "Cookie: authToken=bloodbank-jwt-token"
```

---

## 📄 PDF Certificate Management

### 14. Download Donation Certificate
**GET** `/donations/certificate/:donationRequestId/download` (requires donor authentication)

Download PDF certificate for a successful donation.

**Response:**
- Content-Type: `application/pdf`
- File download with name: `donation-certificate-DonorName-YYYY-MM-DD.pdf`

**Test Example:**
```bash
curl -X GET http://localhost:3000/donations/certificate/donation-request-uuid/download \
  -H "Cookie: authToken=donor-jwt-token" \
  -o "my-donation-certificate.pdf"
```

### 15. Get Donor's Donation History
**GET** `/donations/my-donations` (requires donor authentication)

Get complete donation history with certificate download links.

**Response:**
```json
{
  "success": true,
  "message": "Donation history retrieved successfully.",
  "data": {
    "totalDonations": 3,
    "totalUnits": 6,
    "totalVolume": 2700,
    "donations": [
      {
        "donationId": "donation-1-uuid",
        "donationDate": "2025-08-06T10:00:00Z",
        "bloodType": "A+",
        "bloodBank": "City General Blood Bank",
        "unitsCount": 2,
        "totalVolume": 900,
        "unitsUsed": 2,
        "urgencyLevel": "high",
        "certificateDownloadUrl": "/donations/certificate/donation-1-uuid/download"
      }
    ]
  }
}
```

**Test Example:**
```bash
curl -X GET http://localhost:3000/donations/my-donations \
  -H "Cookie: authToken=donor-jwt-token"
```

---

## 🔍 Search & Filter Endpoints

### 16. Get Patients/Donors by City
**GET** `/patients-donors-by-city/:city`

Get patients and donors in a specific city.

**Test Example:**
```bash
curl -X GET http://localhost:3000/patients-donors-by-city/New-York
```

---

## 📊 Complete Test Suite

### Environment Setup
```bash
# Set base URL
export BASE_URL="http://localhost:3000"

# Test tokens (replace with actual tokens after login)
export DONOR_TOKEN="your-donor-jwt-token"
export PATIENT_TOKEN="your-patient-jwt-token"
export BLOODBANK_TOKEN="your-bloodbank-jwt-token"
```

### Full Test Workflow

```bash
#!/bin/bash

echo "🩸 Blood Bank System - Complete API Test Suite"
echo "=============================================="

# 1. Register entities
echo "📋 1. Registering Patient..."
curl -X POST $BASE_URL/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "patient@test.com",
    "password": "password123",
    "phone": "+1-555-0001",
    "BloodBank": "Test Blood Bank",
    "BloodType": "A+",
    "city": "Test City",
    "state": "TC",
    "age": 30
  }'

echo "🩸 2. Registering Donor..."
curl -X POST $BASE_URL/donor/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Donor",
    "email": "donor@test.com",
    "password": "password123",
    "phone": "+1-555-0002",
    "BloodBank": "Test Blood Bank",
    "BloodType": "A+",
    "city": "Test City",
    "state": "TC",
    "age": 25
  }'

echo "🏥 3. Registering Blood Bank..."
curl -X POST $BASE_URL/bloodbank/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Blood Bank",
    "adminName": "Test Admin",
    "licenseNumber": "TEST-001",
    "email": "admin@testbb.com",
    "password": "password123",
    "phone": "+1-555-0003",
    "totalBloodBags": 1000,
    "address": "123 Test Street",
    "city": "Test City",
    "state": "TC"
  }'

# 4. Create donation request (requires donor login first)
echo "💉 4. Creating Donation Request..."
curl -X POST $BASE_URL/donate \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=$DONOR_TOKEN" \
  -d '{
    "patientId": "patient-uuid",
    "urgencyLevel": "high",
    "requiredUnits": 2,
    "notes": "Test donation request"
  }'

# 5. Accept donation (requires blood bank login)
echo "✅ 5. Accepting Donation..."
curl -X POST $BASE_URL/donations/accept \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=$BLOODBANK_TOKEN" \
  -d '{
    "donationRequestId": "donation-request-uuid",
    "numberOfUnits": 2,
    "notes": "Test acceptance"
  }'

# 6. Check blood inventory
echo "📊 6. Checking Blood Inventory..."
curl -X GET $BASE_URL/donations/inventory \
  -H "Cookie: authToken=$BLOODBANK_TOKEN"

# 7. Download certificate
echo "📄 7. Downloading Certificate..."
curl -X GET $BASE_URL/donations/certificate/donation-request-uuid/download \
  -H "Cookie: authToken=$DONOR_TOKEN" \
  -o "test-certificate.pdf"

echo "✅ Test suite completed!"
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "success": false,
  "details": ["Additional error details if available"]
}
```

### Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## Authentication Flow

1. **Register** using appropriate registration endpoint
2. **Login** (endpoint not shown but typically `/login`)
3. **Receive JWT token** in response cookies
4. **Use token** in subsequent requests via `Cookie: authToken=your-jwt-token`
5. **Token validation** happens automatically via `authMiddleware`

This comprehensive API documentation covers all available endpoints with practical examples for testing the complete blood bank management system! 🩸📋
