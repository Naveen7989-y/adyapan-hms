# 🏥 Adyapan Hospital Queue & Appointment System

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-teal.svg)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passed%20(100%25)-brightgreen.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

An enterprise-grade, production-ready, modular healthcare SaaS platform covering the complete clinical and operational patient lifecycle: from initial registration and token issuance to doctor consultations, digital prescriptions, FEFO pharmacy dispensing, counter billing, role-based dashboards, and executive intelligence reports.

---

## 📋 Table of Contents
- [Architectural Overview](#-architectural-overview)
- [Complete Patient Lifecycle](#-complete-patient-lifecycle)
- [Development Phases (0–18)](#-development-phases-018)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Quick Start](#-quick-start)
  - [Method 1: 1-Command Docker Compose](#method-1-1-command-docker-compose-recommended)
  - [Method 2: Local Development Setup](#method-2-local-development-setup)
- [Seed Staff Credentials](#-seed-staff-credentials)
- [Automated Verification & Testing](#-automated-verification--testing)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🏛 Architectural Overview

- **Backend:** Node.js 20, Express.js (Layered architecture: Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Prisma ORM $\rightarrow$ PostgreSQL).
- **Frontend:** React 18, Vite 5, Tailwind CSS, React Router v6, Axios, Socket.IO Client, Lucide Icons.
- **Database:** PostgreSQL with 21 Prisma models, automated indexes, foreign keys, cascading relationships, and transaction-level advisory locks (`pg_advisory_xact_lock`).
- **Real-Time Engine:** Socket.IO pub/sub with room isolation (`hospital:<id>`, `doctor:<id>`, `public:queue:<id>`) and automatic HTTP polling fallbacks (10s–15s).
- **Documents & Billing:** Binary PDF generation (`pdfkit`) for medical prescriptions and tax invoices, with multi-mode payment and full/partial refund tracking.
- **Queue Engine:** Real-time token sequencing (`T-001`), triage urgency sorting (`NORMAL`, `PRIORITY`, `EMERGENCY`), doctor calling desk, and Public TV Display (`/queue/tv`) with HTML5 Web Speech audio announcements.
- **Security:** Strict JWT Bearer authentication, rate limiting (`express-rate-limit`), Bcrypt password hashing, Helmet headers, CORS origin controls, and role-based route protection.

---

## 🔄 Complete Patient Lifecycle

```
[ 1. Patient Intake ]       UHID Generation (UHID-YYYY-XXXXX) & Demographics
         │
[ 2. Scheduling ]           Department Doctor Rostering & Slot Collision Guard
         │
[ 3. Arrival Check-In ]     Sequential Daily Token Generation (T-001, T-002...)
         │
[ 4. Live Queue ]           Triage Waiting Room & Public TV Display with TTS Audio & Socket.IO
         │
[ 5. Nurse Triage ]         Live Vitals Intake (BP, Heart Rate, Temp, SpO2, BMI)
         │
[ 6. Consultation ]         Clinical Notes, Symptoms, & Mandatory Diagnostic Coding
         │
[ 7. Digital Prescription ] Medication Dosage Schedules (Rx Code: RX-YYYYMM-XXXX) & Downloadable PDF
         │
[ 8. Pharmacy Dispense ]    FEFO (First Expiring First Out) Inventory Batch Allocation
         │
[ 9. Billing & Invoicing ]  Consolidated Encounter Preview & Tax Invoice (INV-YYYYMM-XXXX) & Downloadable PDF
         │
[ 10. Settlement & Refunds] Multi-Mode Payments (Cash/UPI/Card) & Partial/Full Refund Ledger
```

---

## 🚀 Development Phases (0–18)

All 18 phases have been developed, verified, and stabilized with 100% automated test coverage:

- [x] **Phase 0:** Requirements, System Architecture, & Database Modeling
- [x] **Phase 1:** Project Initialization (Express + Vite Monorepo)
- [x] **Phase 2:** Database Foundation (Prisma Schema with 21 Models & Idempotent Seeding)
- [x] **Phase 3:** Authentication & Role-Based Access Control (7 Master Roles)
- [x] **Phase 4:** Patient Management & Sequential UHID Generator
- [x] **Phase 5:** Department & Doctor Management with Weekly Schedules
- [x] **Phase 6:** Appointment Booking & Double-Booking Slot Collision Prevention
- [x] **Phase 7:** Multi-Channel Notification Dispatcher (SMS, WhatsApp, Email Stubs)
- [x] **Phase 8:** Arrival Check-In & Daily Sequential Token Engine (`T-001`)
- [x] **Phase 9:** Live Queue Calling Desk & Public TV Display with Web Speech Audio
- [x] **Phase 10:** Doctor Consultation Workstation, Longitudinal Records, & Live Vitals
- [x] **Phase 11:** Digital Prescription Generator (`RX-YYYYMM-XXXX`) & Dosage Guidelines
- [x] **Phase 12:** Pharmacy Inventory & FEFO Medication Dispensing
- [x] **Phase 13:** Billing, Invoicing (`INV-YYYYMM-XXXX`), & Multi-Mode Payment Ledger
- [x] **Phase 14:** Role-Tailored Dashboards (Admin, Doctor, Receptionist, Nurse, Pharmacist, Accountant)
- [x] **Phase 15:** Operational Reports, Financial Analytics, & CSV Export Engine
- [x] **Phase 16:** Comprehensive Integration Testing & Constraint Stress Testing (16/16 Passed)
- [x] **Phase 17:** Production Deployment, Multi-Stage Dockerfile, Nginx SPA Reverse Proxy, & Cloud Guides
- [x] **Phase 18:** Production Readiness, PostgreSQL Migration, Socket.IO Real-Time Engine, PDF Generation, End-to-End Refunds, Security Rate Limiting & Concurrency Stress 
---

## 👥 Role-Based Access Control (RBAC)

The system supports 7 distinct staff roles with strictly guarded backend endpoints and tailored UI navigation:

| Role | Responsibilities | Key Views |
|------|------------------|-----------|
| `SUPER_ADMIN` | Hospital setup, staff account management, all permissions | Full Access |
| `HOSPITAL_ADMIN` | Executive operations, department oversight, financial reports | Admin Dashboard, Reports, Staff |
| `RECEPTIONIST` | Patient intake, appointments, token issuing, doctor load balancing | Front Desk, Intake, Appointments |
| `DOCTOR` | Calling queue, consultation desk, diagnosis, digital Rx | Doctor Cockpit, Consultation Workstation |
| `NURSE_ASSISTANT` | Patient triage, vital signs intake, queue emergency alerts | Nurse Station, Vitals Queue |
| `PHARMACIST` | Drug inventory, batch tracking, FEFO prescription dispensing | Dispense Desk, Inventory, Alerts |
| `ACCOUNTANT` | Cashier desk, encounter billing, partial/full settlements, receipts | Billing Desk, Cashier, Invoices |

---

## ⚡ Quick Start

### Method 1: 1-Command Docker Compose (Recommended)

Requires [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/).

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/adyapan-hms.git
   cd adyapan-hms
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start all services:**
   ```bash
   docker compose up -d --build
   ```



### Method 2: Local Development Setup

#### Prerequisites
- Node.js 18+ (or 20 LTS)
- PostgreSQL database running locally

#### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

#### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend Vite development server will start on `http://localhost:5173`.

---

## 🔑 Seed Staff Credentials



| Role | Email |
|------|-------|
| **Super Admin** | `superadmin@adyapan.com` |
| **Hospital Admin** | `admin@adyapan.com` |
| **Reception Desk** | `reception@adyapan.com` |
| **Doctor** | `doctor.sharma@adyapan.com` |
| **Nurse Assistant** | `nurse@adyapan.com` |
| **Chief Pharmacist** | `pharmacist@adyapan.com` |
| **Chief Accountant** | `accounts@adyapan.com` |

---

## 🧪 Automated Verification & Testing

The backend includes 18 self-contained verification suites covering every subsystem, concurrency stress tests, and an end-to-end multi-role journey against live PostgreSQL.

Run all 18 test suites with the master test runner:
```bash
cd backend
node src/tests/runAllTests.js
```

### Test Scorecard Results:
```text
============================================================
                 FINAL TEST SCORECARD
============================================================
 1. Phase 2: Database Foundation                   : ✅ PASSED (0.28s)
 2. Phase 3: Authentication & RBAC                 : ✅ PASSED (1.69s)
 3. Phase 4: Patient Management                    : ✅ PASSED (1.60s)
 4. Phase 5: Departments & Doctors                 : ✅ PASSED (1.61s)
 5. Phase 6: Appointments & Slots                  : ✅ PASSED (1.72s)
 6. Phase 7: Notification Foundation               : ✅ PASSED (1.88s)
 7. Phase 8: Check-In & Digital Tokens             : ✅ PASSED (2.01s)
 8. Phase 9: Live Queue & TV Display               : ✅ PASSED (1.58s)
 9. Phase 10: Doctor Consultation Workstation      : ✅ PASSED (1.89s)
10. Phase 11: Digital Prescriptions                : ✅ PASSED (2.91s)
11. Phase 12: Pharmacy & Inventory Management      : ✅ PASSED (3.14s)
12. Phase 13: Billing & Invoicing                  : ✅ PASSED (2.89s)
13. Phase 14: Role-Based Dashboards                : ✅ PASSED (3.98s)
14. Phase 15: Reports & Analytics                  : ✅ PASSED (2.78s)
15. Phase 16a: Master End-to-End Patient Journey   : ✅ PASSED (3.31s)
16. Phase 16b: Boundary & Constraint Stress Testing : ✅ PASSED (2.13s)
17. Phase 18a: Concurrency & Race-Condition Stress Testing : ✅ PASSED (2.72s)
18. Phase 18b: Production Readiness & Master E2E Verification : ✅ PASSED (2.57s)
------------------------------------------------------------
TOTAL TEST SUITES: 18 | PASSED: 18 | FAILED: 0
SYSTEM STABILIZATION SCORE: 100%
============================================================
```

---

## 🌐 Production Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed cloud deployment guides:
- **Free-Tier Split Hosting:** Vercel (Frontend) + Render.com (Backend API) + Supabase/Neon (Postgres).
- **Single-Container Cloud:** Railway.app or Fly.io.
- **Dedicated VPS:** Docker Compose on DigitalOcean, Hetzner, or AWS Lightsail.

---

## 📄 License
ISC License. Built for Adyapan Healthcare Solutions.
