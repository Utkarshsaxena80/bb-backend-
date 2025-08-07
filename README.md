# Blood Bank Management System - Backend API

A comprehensive blood bank management system backend built with Node.js, Express, TypeScript, and Prisma ORM with PostgreSQL database.

## 🚀 Features

- **Patient Registration & Management**
- **Donor Registration & Management**
- **Blood Bank Registration**
- **Donation Request System**
- **City-based Patient/Donor Search**
- **JWT Authentication**
- **Password Hashing with bcrypt**
- **Data Validation with Zod**

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blood-bank/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/blood_bank_db"
   DIRECT_URL="postgresql://username:password@localhost:5432/blood_bank_db"
   JWT_SECRET="your-jwt-secret-key"
   SALT_ROUNDS=10
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📊 Database Schema

### Models:
- **Patients**: Patient registration and details
- **Donors**: Donor registration and details  
- **BloodBanks**: Blood bank registration and information
- **DonationRequest**: Donation requests and tracking

## 🔗 API Endpoints

### 1. Patient Registration
**POST** `/register-patient`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "bloodBank": "City Blood Bank",
  "bloodType": "O+",
  "city": "New York",
  "state": "NY",
  "age": 25,
  "status": true
}
```

**Response:**
```json
{
  "message": "user added",
  "pushUser": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-08-06T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/register-patient \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890",
    "bloodBank": "City Blood Bank",
    "bloodType": "O+",
    "city": "New York",
    "state": "NY",
    "age": 25,
    "status": true
  }'
```

### 2. Donor Registration
**POST** `/donor-registration`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "0987654321",
  "bloodBank": "City Blood Bank",
  "bloodType": "A+",
  "city": "Los Angeles",
  "state": "CA",
  "age": 30,
  "status": true
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/donor-registration \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "phone": "0987654321",
    "bloodBank": "City Blood Bank",
    "bloodType": "A+",
    "city": "Los Angeles",
    "state": "CA",
    "age": 30,
    "status": true
  }'
```

### 3. Blood Bank Registration
**POST** `/register-bloodBank`

**Request Body:**
```json
{
  "name": "Central Blood Bank",
  "adminName": "Dr. Admin",
  "licenseNumber": "LIC123456",
  "email": "admin@bloodbank.com",
  "password": "password123",
  "phone": "5551234567",
  "totalBloodBags": 500,
  "address": "123 Main St",
  "city": "Chicago",
  "state": "IL"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/register-bloodBank \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Central Blood Bank",
    "adminName": "Dr. Admin",
    "licenseNumber": "LIC123456",
    "email": "admin@bloodbank.com",
    "password": "password123",
    "phone": "5551234567",
    "totalBloodBags": 500,
    "address": "123 Main St",
    "city": "Chicago",
    "state": "IL"
  }'
```

### 4. Get All Patients
**GET** `/patientDetail`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/patientDetail
```

**Response:**
```json
{
  "patients": [
    {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "bloodType": "O+",
      "city": "New York",
      "state": "NY",
      "age": 25
    }
  ]
}
```

### 5. Get Patients/Donors by City
**GET** `/getByCity?city=CityName&type=patient`
**GET** `/getByCity?city=CityName&type=donor`

**cURL Examples:**
```bash
# Get patients by city
curl -X GET "http://localhost:3000/getByCity?city=New York&type=patient"

# Get donors by city
curl -X GET "http://localhost:3000/getByCity?city=Los Angeles&type=donor"
```

### 6. Create Donation Request (Protected)
**POST** `/donate`
d
**Headers Required:**
- `Cookie: authToken=your-jwt-token`

**Request Body:**
```json
{
  "patientId": "patient-uuid-here"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/donate \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=your-jwt-token-here" \
  -d '{
    "patientId": "patient-uuid-here"
  }'
```

**Response:**
```json
{
  "message": "Donation request created successfully",
  "donation": {
    "id": "donation-uuid",
    "donorId": "donor-uuid",
    "donor": "Jane Smith",
    "patientId": "patient-uuid",
    "status": "pending",
    "createdAt": "2025-08-06T10:30:00.000Z"
  }
}
```

### 7. Get Active Donations (Protected)
**GET** `/getDonations`

**Headers Required:**
- `Cookie: authToken=your-jwt-token`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/getDonations \
  -H "Cookie: authToken=your-jwt-token-here"
```

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication. After successful registration, a token is set as an HTTP-only cookie named `authToken`.

### Protected Endpoints:
- `/donate` - Create donation request
- `/getDonations` - Get active donations

### Getting Authentication Token:
Register as a patient or donor to receive an authentication token automatically set as a cookie.

## 📝 API Testing Examples

### Using Postman:

1. **Set Base URL**: `http://localhost:3000`
2. **For Protected Routes**: 
   - First register/login to get the auth token
   - The token will be automatically set as a cookie
   - Use the cookie for subsequent requests

### Using Thunder Client (VS Code):

1. Create a new collection
2. Add requests for each endpoint
3. Set the base URL as an environment variable
4. For protected routes, ensure cookies are enabled

### Test Sequence:

1. **Register a Blood Bank**
2. **Register a Patient** 
3. **Register a Donor**
4. **Get Patient Details**
5. **Search by City**
6. **Create Donation Request** (as authenticated donor)
7. **Get Active Donations** (as authenticated user)

## 🐛 Error Responses

### Common Error Formats:

**Validation Error (400):**
```json
{
  "message": "invalid input data"
}
```

**Duplicate User (409):**
```json
{
  "message": "User already exists with this email"
}
```

**Unauthorized (401):**
```json
{
  "error": "Unauthorized. Donor ID missing.",
  "success": false
}
```

**Not Found (404):**
```json
{
  "error": "Donor not found.",
  "success": false
}
```

**Server Error (500):**
```json
{
  "message": "Cannot register at this moment"
}
```

## 🛠️ Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Build the project
npm run build

# Run tests
npm test
```

## 📁 Project Structure

```
backend/
├── controllers/          # Route handlers
├── middlewares/          # Authentication & validation
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Utility functions
├── prisma/              # Database schema & migrations
├── src/                 # Main application entry
└── README.md
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `DIRECT_URL` | Direct PostgreSQL connection | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `SALT_ROUNDS` | bcrypt salt rounds (default: 10) | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |

## 📞 Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Note**: This is a development server. For production deployment, ensure proper security configurations, environment variables, and database optimizations.
