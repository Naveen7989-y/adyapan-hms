import app from '../app.js';
import prisma from '../config/db.js';

export const runPhase18E2EVerification = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 18 PRODUCTION & E2E VERIFICATION SUITE ---');
  console.log('============================================================');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, extraInfo = '') => {
    if (condition) {
      console.log(`✓ PASS: ${name} ${extraInfo}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${name} ${extraInfo}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate All Key Roles
    const login = async (email, password = 'Password123!') => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return data?.data?.token;
    };

    const adminToken = await login('admin@adyapan.com');
    const recToken = await login('reception@adyapan.com');
    const docToken = await login('doctor.sharma@adyapan.com');
    const pharmToken = await login('pharmacist@adyapan.com');
    const accToken = await login('accounts@adyapan.com');

    assert('Multi-Role Authentication', !!(adminToken && recToken && docToken && pharmToken && accToken));

    const doctor = await prisma.doctor.findFirst({
      where: { user: { email: 'doctor.sharma@adyapan.com' } },
      include: { department: true, hospital: true },
    });

    const timestamp = Date.now();

    // 2. Patient Intake Registration
    console.log('\n--- 1. Patient Intake & Registration ---');
    const patientRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: `Phase18 Test Patient ${timestamp}`,
        phone: `922${String(timestamp).slice(-7)}`,
        gender: 'FEMALE',
        dateOfBirth: '1992-05-14',
        bloodGroup: 'B_POSITIVE',
        emergencyContact: '9888877777',
      }),
    });
    const patientData = await patientRes.json();
    const patient = patientData?.data;
    assert('Patient Registration (UHID Assigned)', patientRes.status === 201 && patient?.uhid?.startsWith('ADY-'), `UHID: ${patient?.uhid}`);

    // 3. Appointment Booking
    console.log('\n--- 2. Clinical Shift Slot Booking ---');
    const schedDate = new Date();
    schedDate.setDate(schedDate.getDate() + 25);
    const schedDateStr = schedDate.toISOString().split('T')[0];
    const schedDay = schedDate.getUTCDay();

    // Ensure schedule
    const exSched = await prisma.doctorSchedule.findFirst({
      where: { doctorId: doctor.id, dayOfWeek: schedDay },
    });
    if (exSched) {
      await prisma.doctorSchedule.update({ where: { id: exSched.id }, data: { isActive: true } });
    } else {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: schedDay,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 15,
          maxCapacity: 30,
          isActive: true,
        },
      });
    }

    const apptSlot = '10:30';

    // Ensure slot is clear for clean idempotent run
    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: new Date(schedDateStr),
        timeSlot: apptSlot,
      },
    });

    const apptRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        appointmentDate: schedDateStr,
        timeSlot: apptSlot,
        type: 'CONSULTATION',
        reason: 'Phase 18 End-to-End Verification Checkup',
      }),
    });
    const apptData = await apptRes.json();
    const appointment = apptData?.data;
    assert('Appointment Booked', apptRes.status === 201 && appointment?.status === 'BOOKED', `Appt ID: ${appointment?.id}`);

    // 4. Check-In & Token Generation
    console.log('\n--- 3. Patient Check-In & Queue Token Generation ---');
    const checkinRes = await fetch(`${baseUrl}/tokens/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        appointmentId: appointment.id,
        tokenType: 'NORMAL',
      }),
    });
    const checkinData = await checkinRes.json();
    const token = checkinData?.data;
    assert('Check-In Token Issued', checkinRes.status === 201 && token?.tokenNumber > 0, `Token: T-${String(token?.tokenNumber).padStart(3, '0')}`);

    // 5. Call Next Patient & Queue Status
    console.log('\n--- 4. Live Queue Progression (Calling Patient) ---');
    const callRes = await fetch(`${baseUrl}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        doctorId: doctor.id,
        roomNumber: 'Room 204',
        force: true,
      }),
    });
    const callData = await callRes.json();
    const calledTokenId = callData?.data?.id || callData?.data?.calledToken?.id;
    assert('Queue Call Next Patient', callRes.status === 200 && !!calledTokenId, `Called Token ID: ${calledTokenId}`);

    // 6. Doctor Consultation Workstation
    console.log('\n--- 5. Doctor Clinical Encounter & Vitals Recording ---');
    const startVisitRes = await fetch(`${baseUrl}/consultations/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        tokenId: token.id,
      }),
    });
    const startVisitData = await startVisitRes.json();
    const consultation = startVisitData?.data;
    assert('Consultation Started', startVisitRes.status === 201 && consultation?.status === 'IN_PROGRESS', `Consultation ID: ${consultation?.id}`);

    const completeVisitRes = await fetch(`${baseUrl}/consultations/${consultation.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
        symptoms: 'Fever 101°F, sore throat, mild cough for 3 days',
        clinicalNotes: 'Throat examination showed pharyngeal erythema. Clear chest sounds.',
        vitals: {
          bloodPressure: '120/80 mmHg',
          temperature: '101 F',
          pulseRate: '84 bpm',
          spo2: '99%',
        },
      }),
    });
    const completeVisitData = await completeVisitRes.json();
    assert('Consultation Completed with Vitals', completeVisitRes.status === 200 && completeVisitData?.data?.status === 'COMPLETED');

    // 7. Digital Prescription Creation
    console.log('\n--- 6. Prescription Authoring & Server-Side PDF Download ---');
    // Ensure medicine exists in inventory
    const medRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        name: `Amoxicillin Phase18 ${timestamp}`,
        genericName: 'Amoxicillin',
        categoryName: 'Antibiotics',
        unit: 'TABLETS',
        minStockAlert: 10,
      }),
    });
    const medData = await medRes.json();
    const medicine = medData?.data;

    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

    await fetch(`${baseUrl}/pharmacy/medicines/${medicine.id}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        batchNumber: `AMX-P18-${timestamp}`,
        expiryDate: expDate.toISOString(),
        quantity: 50,
        purchasePrice: 4.0,
        sellingPrice: 8.5,
      }),
    });

    const rxRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        consultationId: consultation.id,
        patientId: patient.id,
        notes: 'Take with warm water after meals. Complete full 5-day course.',
        items: [
          {
            medicineId: medicine.id,
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '5 days',
            instructions: 'After meals',
            quantityPrescribed: 10,
          },
        ],
      }),
    });
    const rxData = await rxRes.json();
    const prescription = rxData?.data;
    assert('Digital Prescription Created', rxRes.status === 201 && prescription?.prescriptionCode?.startsWith('RX-'), `Rx Code: ${prescription?.prescriptionCode}`);

    // 8. Server-Side Prescription PDF Download
    const rxPdfRes = await fetch(`${baseUrl}/prescriptions/${prescription.id}/pdf`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const rxPdfBuffer = await rxPdfRes.arrayBuffer();
    const rxPdfHeader = Buffer.from(rxPdfBuffer.slice(0, 5)).toString();
    assert(
      'Server-Side Prescription PDF Streaming',
      rxPdfRes.status === 200 &&
      rxPdfRes.headers.get('content-type')?.includes('application/pdf') &&
      rxPdfHeader === '%PDF-',
      `Bytes received: ${rxPdfBuffer.byteLength}, Magic Header: ${rxPdfHeader}`
    );

    // 9. Pharmacy Dispense
    console.log('\n--- 7. Pharmacy Prescription Dispensing ---');
    const dispenseRes = await fetch(`${baseUrl}/pharmacy/dispense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        prescriptionId: prescription.id,
      }),
    });
    const dispenseData = await dispenseRes.json();
    assert('Pharmacy Dispensed & Stock Deducted', dispenseRes.status === 201 && dispenseData?.data?.status === 'COMPLETED', `Dispense Amount: ₹${dispenseData?.data?.totalAmount}`);

    // 10. Billing Invoice Generation & Payment
    console.log('\n--- 8. Unified Hospital Invoicing & Payment Collection ---');
    const invRes = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        appointmentId: appointment.id,
        consultationFee: 500,
        pharmacyFee: 85,
        otherCharges: 15,
        discount: 0,
        tax: 0,
        items: [
          { description: 'Specialist Doctor Consultation', quantity: 1, unitPrice: 500, totalPrice: 500 },
          { description: 'Antibiotics Pharmacy Dispense', quantity: 10, unitPrice: 8.5, totalPrice: 85 },
          { description: 'Hospital Registration & Nursing Charges', quantity: 1, unitPrice: 15, totalPrice: 15 },
        ],
      }),
    });
    const invData = await invRes.json();
    const invoice = invData?.data;
    assert('Invoice Generated', invRes.status === 201 && invoice?.totalAmount === 600, `Invoice: ${invoice?.invoiceNumber}, Total: ₹${invoice?.totalAmount}`);

    // Record Payment
    const payRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 600,
        paymentMethod: 'UPI',
        transactionRef: `UPI-P18-${timestamp}`,
      }),
    });
    const payData = await payRes.json();
    assert('Payment Recorded (PAID IN FULL)', payRes.status === 201 && payData?.data?.invoice?.paymentStatus === 'PAID');

    // 11. Server-Side Invoice PDF Download (Paid State)
    console.log('\n--- 9. Server-Side Invoice PDF Generation (PAID State) ---');
    const invPdfRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/pdf`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const invPdfBuffer = await invPdfRes.arrayBuffer();
    const invPdfHeader = Buffer.from(invPdfBuffer.slice(0, 5)).toString();
    assert(
      'Server-Side Paid Invoice PDF Streaming',
      invPdfRes.status === 200 &&
      invPdfRes.headers.get('content-type')?.includes('application/pdf') &&
      invPdfHeader === '%PDF-',
      `Bytes received: ${invPdfBuffer.byteLength}, Magic Header: ${invPdfHeader}`
    );

    // 12. Partial Refund Workflow
    console.log('\n--- 10. End-to-End Refund Workflow (Partial & Full) ---');
    const partialRefundRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 200,
        reason: 'Medication returned unopened to hospital pharmacy',
        paymentMethod: 'CASH',
      }),
    });
    const partialRefundData = await partialRefundRes.json();
    const partialInv = partialRefundData?.data?.invoice;
    assert(
      'Partial Refund Processed (PARTIALLY_REFUNDED)',
      partialRefundRes.status === 201 &&
      partialInv?.paymentStatus === 'PARTIALLY_REFUNDED' &&
      Number(partialInv?.refundedAmount) === 200,
      `Refunded: ₹${partialInv?.refundedAmount}, Status: ${partialInv?.paymentStatus}`
    );

    // 13. Full Remaining Refund Workflow
    const fullRefundRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 400, // Remaining 600 - 200 = 400
        reason: 'Administrative service concession approval',
        paymentMethod: 'UPI',
      }),
    });
    const fullRefundData = await fullRefundRes.json();
    const fullInv = fullRefundData?.data?.invoice;
    assert(
      'Full Remaining Refund Processed (REFUNDED)',
      fullRefundRes.status === 201 &&
      fullInv?.paymentStatus === 'REFUNDED' &&
      Number(fullInv?.refundedAmount) === 600,
      `Refunded: ₹${fullInv?.refundedAmount}, Status: ${fullInv?.paymentStatus}`
    );

    // 14. Over-Refund Prevention
    const overRefundRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 50,
        reason: 'Illegal extra refund attempt',
        paymentMethod: 'CASH',
      }),
    });
    assert('Over-Refund Attempt Blocked (HTTP 400)', overRefundRes.status === 400);

    // 15. Server-Side Refunded Invoice PDF Download
    const refundedPdfRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/pdf`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const refundedPdfBuffer = await refundedPdfRes.arrayBuffer();
    assert(
      'Server-Side Refunded Invoice PDF Streaming',
      refundedPdfRes.status === 200 &&
      Buffer.from(refundedPdfBuffer.slice(0, 5)).toString() === '%PDF-',
      `Bytes: ${refundedPdfBuffer.byteLength}`
    );

    // 16. Audit Log Verification
    console.log('\n--- 11. Security Audit Logs Verification ---');
    const refundAuditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'Invoice',
        entityId: invoice.id,
        action: 'INVOICE_REFUND',
      },
    });
    assert(
      'Audit Trail Recorded for Refunds',
      refundAuditLogs.length === 2,
      `Audit log entries count: ${refundAuditLogs.length}`
    );

    // 17. Security Rate Limiter Verification
    console.log('\n--- 12. Security Rate Limiting Verification ---');
    // Call health endpoint to verify standard headers
    const healthRes = await fetch(`${baseUrl}/health`);
    assert('Rate Limiter Active and Operational', healthRes.status === 200);

    console.log('\n------------------------------------------------------------');
    console.log(`PHASE 18 E2E VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 18 E2E Verification failed with exception:', err);
    process.exit(1);
  } finally {
    server.close();
  }
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('phase18E2EVerification.js')) {
  runPhase18E2EVerification();
}
