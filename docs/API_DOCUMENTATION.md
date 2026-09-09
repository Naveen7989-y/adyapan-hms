# Adyapan Hospital Queue & Appointment System — API Documentation

Base URL: `http://localhost:5000/api` (or configured `PORT`)  
All protected endpoints require an HTTP Authorization header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication

### Login
- **METHOD:** `POST`
- **ENDPOINT:** `/api/auth/login`
- **AUTHENTICATION:** None (Rate limited: max 30 attempts/15m)
- **AUTHORIZED ROLES:** Public
- **DESCRIPTION:** Authenticates a hospital staff member and returns user details and a JWT Bearer token.
- **REQUEST BODY:**
  ```json
  {
    "email": "doctor.sharma@adyapan.com",
    "password": "Password123!"
  }
  ```
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "uuid",
        "name": "Dr. Rajesh Sharma",
        "email": "doctor.sharma@adyapan.com",
        "role": "DOCTOR",
        "hospitalId": "uuid"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### Get Current User Profile
- **METHOD:** `GET`
- **ENDPOINT:** `/api/auth/me`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** All Authenticated Roles
- **DESCRIPTION:** Retrieves the profile of the currently logged-in user.
- **REQUEST BODY:** None
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "name": "Dr. Rajesh Sharma", "role": "DOCTOR" }
  }
  ```

---

## 2. Users & Staff Management

### List Hospital Staff Users
- **METHOD:** `GET`
- **ENDPOINT:** `/api/users`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`
- **DESCRIPTION:** Lists all staff accounts in the hospital with optional role filtering.
- **REQUEST BODY:** None (Query: `?role=DOCTOR&search=sharma`)
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        { "id": "uuid", "name": "Dr. Rajesh Sharma", "email": "doctor.sharma@adyapan.com", "role": "DOCTOR", "status": "ACTIVE" }
      ]
    }
  }
  ```

### Create Staff User
- **METHOD:** `POST`
- **ENDPOINT:** `/api/users`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`
- **DESCRIPTION:** Creates a new staff member account and hashes password with Bcrypt.
- **REQUEST BODY:**
  ```json
  {
    "name": "Dr. Priya Patel",
    "email": "dr.priya@adyapan.com",
    "password": "Password123!",
    "role": "DOCTOR",
    "phone": "9876543210"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": { "id": "uuid", "name": "Dr. Priya Patel", "role": "DOCTOR" }
  }
  ```

---

## 3. Patients Management

### Register Patient Intake
- **METHOD:** `POST`
- **ENDPOINT:** `/api/patients`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `NURSE_ASSISTANT`
- **DESCRIPTION:** Registers a patient and generates an atomic unique UHID (`ADY-YYYYMM-XXXX`).
- **REQUEST BODY:**
  ```json
  {
    "fullName": "Amit Kumar",
    "phone": "9876501234",
    "gender": "MALE",
    "dateOfBirth": "1990-08-15",
    "bloodGroup": "O_POSITIVE",
    "emergencyContact": "9876509999"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "uhid": "ADY-202609-0001",
      "fullName": "Amit Kumar",
      "phone": "9876501234"
    }
  }
  ```

### Search / List Patients
- **METHOD:** `GET`
- **ENDPOINT:** `/api/patients`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `DOCTOR`, `NURSE_ASSISTANT`
- **DESCRIPTION:** Queries patients by full name, phone number, or UHID.
- **REQUEST BODY:** None (Query: `?search=Amit&page=1&limit=20`)
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patients": [{ "id": "uuid", "uhid": "ADY-202609-0001", "fullName": "Amit Kumar" }],
      "pagination": { "total": 1, "page": 1, "totalPages": 1 }
    }
  }
  ```

---

## 4. Departments

### List Departments
- **METHOD:** `GET`
- **ENDPOINT:** `/api/departments`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** All Authenticated Roles
- **DESCRIPTION:** Retrieves active clinical departments and active doctor counts.
- **REQUEST BODY:** None
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "name": "General Medicine", "code": "GEN_MED", "_count": { "doctors": 4 } }
    ]
  }
  ```

---

## 5. Doctors & Schedules

### List Doctors with Availability
- **METHOD:** `GET`
- **ENDPOINT:** `/api/doctors`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** All Authenticated Roles
- **DESCRIPTION:** Retrieves doctors with department, status, and consultation fees.
- **REQUEST BODY:** None (Query: `?departmentId=uuid&status=ACTIVE`)
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "doctors": [
        { "id": "uuid", "name": "Dr. Rajesh Sharma", "specialization": "Senior Physician", "consultationFee": 500 }
      ]
    }
  }
  ```

### Query Doctor Available Slots
- **METHOD:** `GET`
- **ENDPOINT:** `/api/appointments/slots`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** All Authenticated Roles
- **DESCRIPTION:** Computes available 15-minute booking slots excluding breaks and booked slots.
- **REQUEST BODY:** None (Query: `?doctorId=uuid&date=2026-09-20`)
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-09-20",
      "slots": [
        { "timeSlot": "09:00", "isAvailable": true, "isBooked": false },
        { "timeSlot": "09:15", "isAvailable": false, "isBooked": true }
      ]
    }
  }
  ```

---

## 6. Appointments

### Book Appointment
- **METHOD:** `POST`
- **ENDPOINT:** `/api/appointments`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST`
- **DESCRIPTION:** Atomically locks slot via `pg_advisory_xact_lock` and books appointment.
- **REQUEST BODY:**
  ```json
  {
    "patientId": "uuid",
    "doctorId": "uuid",
    "departmentId": "uuid",
    "appointmentDate": "2026-09-20",
    "timeSlot": "10:30",
    "type": "CONSULTATION",
    "reason": "Seasonal cold and fever"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "message": "Appointment booked successfully",
    "data": { "id": "uuid", "timeSlot": "10:30", "status": "BOOKED" }
  }
  ```

---

## 7. Arrival Check-In & Tokens

### Check In Booked Appointment
- **METHOD:** `POST`
- **ENDPOINT:** `/api/tokens/checkin`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `NURSE_ASSISTANT`
- **DESCRIPTION:** Transitions appointment to CHECKED_IN and generates daily sequential token (`T-001`).
- **REQUEST BODY:**
  ```json
  {
    "appointmentId": "uuid",
    "tokenType": "NORMAL"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "tokenNumber": 4, "tokenType": "NORMAL", "status": "WAITING" }
  }
  ```

### Issue Walk-In Token
- **METHOD:** `POST`
- **ENDPOINT:** `/api/tokens/walk-in`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `DOCTOR`
- **DESCRIPTION:** Issues an unscheduled walk-in queue token.
- **REQUEST BODY:**
  ```json
  {
    "patientId": "uuid",
    "doctorId": "uuid",
    "departmentId": "uuid",
    "priority": "PRIORITY"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "tokenNumber": 5, "tokenType": "PRIORITY", "status": "WAITING" }
  }
  ```

---

## 8. Live Queue & TV Display

### Public TV Display Feed
- **METHOD:** `GET`
- **ENDPOINT:** `/api/queue/public-display`
- **AUTHENTICATION:** None (Rate limited: 180 req/min)
- **AUTHORIZED ROLES:** Public Display Screens
- **DESCRIPTION:** Unauthenticated masked feed for waiting room wall monitors.
- **REQUEST BODY:** None (Query: `?hospitalId=uuid`)
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "nowServing": [
        { "tokenNumber": 2, "patientName": "A*** K****", "doctorName": "Dr. Sharma", "roomNumber": "102" }
      ],
      "upcoming": [
        { "tokenNumber": 3, "patientName": "P**** P****" }
      ]
    }
  }
  ```

### Call Next Patient
- **METHOD:** `POST`
- **ENDPOINT:** `/api/queue/call-next`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DOCTOR`, `NURSE_ASSISTANT`
- **DESCRIPTION:** Calls the next patient in triage order, emits Socket.IO event, and triggers TTS voice.
- **REQUEST BODY:**
  ```json
  {
    "doctorId": "uuid",
    "roomNumber": "Room 102",
    "force": false
  }
  ```
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "tokenNumber": 3,
      "status": "CALLED",
      "roomNumber": "Room 102",
      "ttsAnnouncement": "Token T 0 0 3, please proceed to Dr. Rajesh Sharma in Room 102."
    }
  }
  ```

---

## 9. Doctor Consultations

### Start Visit
- **METHOD:** `POST`
- **ENDPOINT:** `/api/consultations/start`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `DOCTOR`, `SUPER_ADMIN`
- **DESCRIPTION:** Begins clinical visit and transitions token to `IN_CONSULTATION`.
- **REQUEST BODY:**
  ```json
  { "tokenId": "uuid" }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "status": "IN_PROGRESS" }
  }
  ```

### Complete Consultation
- **METHOD:** `POST`
- **ENDPOINT:** `/api/consultations/:id/complete`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `DOCTOR`, `SUPER_ADMIN`
- **DESCRIPTION:** Completes visit with mandatory clinical notes, symptoms, and diagnosis.
- **REQUEST BODY:**
  ```json
  {
    "diagnosis": "Acute Bronchitis",
    "symptoms": "Cough and low-grade fever",
    "clinicalNotes": "Lungs clear on auscultation",
    "vitals": { "bloodPressure": "120/80", "pulseRate": "78" }
  }
  ```
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "status": "COMPLETED" }
  }
  ```

---

## 10. Prescriptions (Rx) & PDF Streaming

### Author Digital Prescription
- **METHOD:** `POST`
- **ENDPOINT:** `/api/prescriptions`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `DOCTOR`, `SUPER_ADMIN`
- **DESCRIPTION:** Creates digital Rx with structured medication dosage entries.
- **REQUEST BODY:**
  ```json
  {
    "consultationId": "uuid",
    "patientId": "uuid",
    "notes": "Take after meals",
    "items": [
      {
        "medicineId": "uuid",
        "dosage": "500mg",
        "frequency": "1-0-1",
        "duration": "5 days",
        "quantityPrescribed": 10
      }
    ]
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "prescriptionCode": "RX-202609-0001", "status": "ACTIVE" }
  }
  ```

### Download Prescription PDF
- **METHOD:** `GET`
- **ENDPOINT:** `/api/prescriptions/:id/pdf`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `DOCTOR`, `RECEPTIONIST`, `HOSPITAL_ADMIN`, `PHARMACIST`
- **DESCRIPTION:** Streams binary PDF document (`application/pdf`) with hospital letterhead and Rx table.
- **RESPONSE (200 OK):** Binary stream starting with `%PDF-` header.

---

## 11. Pharmacy & Inventory

### Add Medicine
- **METHOD:** `POST`
- **ENDPOINT:** `/api/pharmacy/medicines`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `PHARMACIST`, `HOSPITAL_ADMIN`
- **REQUEST BODY:**
  ```json
  {
    "name": "Amoxicillin 500mg",
    "genericName": "Amoxicillin",
    "categoryName": "Antibiotics",
    "unit": "CAPSULES",
    "minStockAlert": 50
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  { "success": true, "data": { "id": "uuid", "name": "Amoxicillin 500mg" } }
  ```

### Add Medicine Batch
- **METHOD:** `POST`
- **ENDPOINT:** `/api/pharmacy/medicines/:id/batches`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `PHARMACIST`, `HOSPITAL_ADMIN`
- **REQUEST BODY:**
  ```json
  {
    "batchNumber": "AMX-2026-01",
    "expiryDate": "2027-12-31",
    "quantity": 100,
    "purchasePrice": 3.5,
    "sellingPrice": 7.0
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  { "success": true, "data": { "id": "uuid", "batchNumber": "AMX-2026-01", "quantity": 100 } }
  ```

### Dispense Prescription (FEFO)
- **METHOD:** `POST`
- **ENDPOINT:** `/api/pharmacy/dispense`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `PHARMACIST`, `SUPER_ADMIN`
- **DESCRIPTION:** Allocates batches via FEFO and atomically deducts stock inside transaction.
- **REQUEST BODY:**
  ```json
  { "prescriptionId": "uuid" }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "message": "Medications dispensed successfully",
    "data": { "id": "uuid", "totalAmount": 70.0, "status": "COMPLETED" }
  }
  ```

---

## 12. Billing & Invoices

### Generate Encounter Invoice
- **METHOD:** `POST`
- **ENDPOINT:** `/api/billing/invoices`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `ACCOUNTANT`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
- **DESCRIPTION:** Generates unified tax invoice (`INV-YYYYMM-XXXX`).
- **REQUEST BODY:**
  ```json
  {
    "patientId": "uuid",
    "consultationFee": 500,
    "pharmacyFee": 70,
    "otherCharges": 30,
    "discount": 0,
    "items": [
      { "description": "Consultation", "quantity": 1, "unitPrice": 500, "totalPrice": 500 },
      { "description": "Antibiotics Dispense", "quantity": 10, "unitPrice": 7, "totalPrice": 70 }
    ]
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "invoiceNumber": "INV-202609-0001", "totalAmount": 600, "paymentStatus": "PENDING" }
  }
  ```

### Download Invoice PDF
- **METHOD:** `GET`
- **ENDPOINT:** `/api/billing/invoices/:id/pdf`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `ACCOUNTANT`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`, `RECEPTIONIST`
- **DESCRIPTION:** Streams binary PDF tax receipt (`application/pdf`) with payment history and watermarks.
- **RESPONSE (200 OK):** Binary stream starting with `%PDF-`.

---

## 13. Payments & Settlements

### Record Payment
- **METHOD:** `POST`
- **ENDPOINT:** `/api/billing/invoices/:id/payments`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `ACCOUNTANT`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
- **DESCRIPTION:** Records payment against invoice balance.
- **REQUEST BODY:**
  ```json
  {
    "amount": 600,
    "paymentMethod": "UPI",
    "transactionRef": "UPI-TRANS-9921"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "payment": { "amount": 600, "paymentMethod": "UPI" },
      "invoice": { "paidAmount": 600, "paymentStatus": "PAID" }
    }
  }
  ```

---

## 14. Refunds

### Issue Partial or Full Refund
- **METHOD:** `POST`
- **ENDPOINT:** `/api/billing/invoices/:id/refunds`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `ACCOUNTANT`
- **DESCRIPTION:** Atomically locks invoice, validates refundable balance, creates REFUND transaction, and updates invoice status (`PARTIALLY_REFUNDED` or `REFUNDED`).
- **REQUEST BODY:**
  ```json
  {
    "amount": 200,
    "reason": "Medication return to pharmacy",
    "paymentMethod": "CASH"
  }
  ```
- **RESPONSE (201 Created):**
  ```json
  {
    "success": true,
    "message": "Refund of ₹200.00 processed successfully",
    "data": {
      "refund": { "amount": 200, "type": "REFUND", "status": "SUCCESS" },
      "invoice": { "refundedAmount": 200, "paymentStatus": "PARTIALLY_REFUNDED" }
    }
  }
  ```

---

## 15. Reports & Analytics

### Financial Revenue Report
- **METHOD:** `GET`
- **ENDPOINT:** `/api/reports/financial`
- **AUTHENTICATION:** Bearer Token
- **AUTHORIZED ROLES:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `ACCOUNTANT`
- **DESCRIPTION:** Delivers revenue breakdown by payment method, daily collection trends, and refunded amounts.
- **RESPONSE (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalBilled": 125000,
      "totalCollected": 118000,
      "totalRefunded": 2500,
      "collectionsByMethod": { "CASH": 45000, "UPI": 58000, "CARD": 15000 }
    }
  }
  ```
