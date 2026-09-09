# Adyapan Hospital Queue & Appointment System — Local Setup Guide

A beginner-friendly, step-by-step walkthrough for configuring and running the **Adyapan Hospital Queue & Appointment System** on your local machine.

---

## Prerequisites
Ensure the following software is installed on your computer:
1. **Node.js**: v18.x or v20.x ([Download Node.js](https://nodejs.org/))
2. **npm**: Included with Node.js (v9.x or v10.x)
3. **PostgreSQL**: v14, v15, v16, or v18 ([Download PostgreSQL](https://www.postgresql.org/download/))

---

## Step 1: Extract or Clone the Project
Extract the zip package or navigate into the root project directory:
```bash
cd Adyapan-Hospital-Queue-Appointment-System
```

---

## Step 2: Install Backend Dependencies
Open a terminal in the project root and navigate to `backend`:
```bash
cd backend
npm install
```

---

## Step 3: Install Frontend Dependencies
Open a second terminal or navigate to `frontend`:
```bash
cd ../frontend
npm install
```

---

## Step 4: Install & Start PostgreSQL
Ensure your PostgreSQL service is running. You can verify connection with `psql`:
```bash
psql -U postgres
```

---

## Step 5: Create the PostgreSQL Database
Inside PostgreSQL shell (`psql`), create the project database:
```sql
CREATE DATABASE adyapan_hms;
\q
```

---

## Step 6: Configure Environment Variables

### Backend `.env`
In the `backend/` folder, copy the example file to `.env`:
```bash
cd backend
cp .env.example .env
```
Open `backend/.env` in any text editor and configure your database credentials:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/adyapan_hms?schema=public"
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
In the `frontend/` folder, copy the example file to `.env`:
```bash
cd ../frontend
cp .env.example .env
```
Ensure the API base URL matches the backend port:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Step 7: Run Prisma Database Migrations
From the `backend/` folder, synchronize the schema with PostgreSQL:
```bash
cd ../backend
npx prisma db push
```
*(Or run `npx prisma migrate deploy`)*

---

## Step 8: Seed Initial Hospital Data
Run the idempotent seed script to populate hospital departments, doctors, weekly schedules, pharmacy inventory, and demo staff accounts:
```bash
node prisma/seed.js
```
You should see:
```text
✓ Hospital created
✓ 7 User Roles seeded
✓ Departments & Doctors seeded with weekly clinical shifts
✓ Pharmacy catalog & medicine batches populated
✓ Database seeding completed successfully!
```

---

## Step 9: Start the Backend Server
From `backend/`, start the Express API and Socket.IO server:
```bash
npm run dev
```
Output:
```text
[HTTP] Server running on http://localhost:5000
[Socket.IO] Real-time engine listening on port 5000
```

---

## Step 10: Start the Frontend Development Server
From a second terminal in `frontend/`, launch the Vite development server:
```bash
cd ../frontend
npm run dev
```
Output:
```text
VITE v5.4.21  ready in 350 ms
➜  Local:   http://localhost:5173/
```

---

## Step 11: Open the Application
Open your browser and navigate to:
```
http://localhost:5173
```

---

## Step 12: Login with Demo Staff Accounts
You can log in to explore any of the 7 role-based workstations using the seeded development credentials:

| Staff Role | Demo Email Address | Default Password | Workstation / Views |
|---|---|---|---|
| **Super Administrator** | `admin@adyapan.com` | `Password123!` | System Setup, Staff Management, Audit Logs |
| **Hospital Administrator** | `hospital.admin@adyapan.com` | `Password123!` | Executive KPIs, Departments, Financial Reports |
| **Receptionist** | `reception@adyapan.com` | `Password123!` | Patient Intake, Appointments, Check-In, Tokens |
| **Senior Physician** | `doctor.sharma@adyapan.com` | `Password123!` | Calling Queue, Consultation Desk, Digital Rx |
| **Cardiologist** | `doctor.desai@adyapan.com` | `Password123!` | Calling Queue, Consultation Desk, Digital Rx |
| **Nurse Assistant** | `nurse@adyapan.com` | `Password123!` | Vitals Triage Intake, Queue Monitor |
| **Chief Pharmacist** | `pharmacist@adyapan.com` | `Password123!` | FEFO Dispensing, Batches, Stock Alerts |
| **Chief Accountant** | `accounts@adyapan.com` | `Password123!` | Tax Invoices, Collections, Refund Desk |

---

## Step 13: Run the Automated Verification Suite
To verify that all 18 subsystems and concurrency guards are functioning properly against your database:
```bash
cd backend
node src/tests/runAllTests.js
```
Expected output:
```text
TOTAL TEST SUITES: 18 | PASSED: 18 | FAILED: 0
SYSTEM STABILIZATION SCORE: 100%
```
