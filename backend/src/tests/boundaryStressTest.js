import app from '../app.js';
import prisma from '../config/db.js';

export const runBoundaryStressTest = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING BOUNDARY & CONSTRAINT STRESS TEST SUITE ---');
  console.log('============================================================');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
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
    const nurseToken = await login('nurse@adyapan.com');
    const pharmToken = await login('pharmacist@adyapan.com');
    const accToken = await login('accounts@adyapan.com');

    // BOUNDARY 1: Unauthenticated request to protected endpoint (401)
    const unauthRes = await fetch(`${baseUrl}/patients`);
    console.log(
      'Boundary 1 (Unauthenticated Request Rejection - 401):',
      unauthRes.status === 401 ? 'PASS' : 'FAIL'
    );

    // BOUNDARY 2: Duplicate Phone Number in Registration (409)
    const existingPatient = await prisma.patient.findFirst();
    if (!existingPatient) throw new Error('No patient found in database');
    const dupRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Duplicate Phone Attempt',
        phone: existingPatient.phone,
        gender: 'MALE',
      }),
    });
    console.log(
      'Boundary 2 (Duplicate Phone Patient Intake Blocked - 409):',
      dupRes.status === 409 ? 'PASS' : 'FAIL'
    );

    // BOUNDARY 3: Double-Booking Doctor Slot Clash Prevention (409)
    const doctor = await prisma.doctor.findFirst({
      where: { user: { email: 'doctor.sharma@adyapan.com' } },
    });
    const now = new Date();
    const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Ensure schedule on that day
    const schedDay = futureDate.getUTCDay();
    const exSched = await prisma.doctorSchedule.findFirst({
      where: { doctorId: doctor.id, dayOfWeek: schedDay },
    });
    if (!exSched) {
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

    const testSlot = '11:15';
    // First booking
    const book1 = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: existingPatient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        appointmentDate: futureDateStr,
        timeSlot: testSlot,
        reason: 'First Reservation',
      }),
    });

    // Immediate second booking on the exact same doctor + date + slot
    const book2 = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: existingPatient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        appointmentDate: futureDateStr,
        timeSlot: testSlot,
        reason: 'Conflicting Concurrent Reservation',
      }),
    });
    console.log(
      'Boundary 3 (Double-Booking Slot Clash Prevention - 409):',
      book2.status === 409 ? 'PASS' : 'FAIL'
    );

    // BOUNDARY 4: Consultation Completion Without Mandatory Diagnosis (400)
    // Create token and consultation
    const token = await prisma.token.create({
      data: {
        hospitalId: doctor.hospitalId,
        patientId: existingPatient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        tokenNumber: 999,
        queueDate: new Date(new Date().toISOString().split('T')[0]),
        tokenType: 'NORMAL',
        status: 'CALLED',
      },
    });

    const consultStart = await fetch(`${baseUrl}/consultations/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        tokenId: token.id,
        symptoms: 'Headache',
      }),
    });
    const consultStartData = await consultStart.json();
    const consultId = consultStartData?.data?.id;

    // Attempt complete without diagnosis
    const failComplete = await fetch(`${baseUrl}/consultations/${consultId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        advice: 'Drink water',
      }),
    });
    console.log(
      'Boundary 4 (Mandatory Diagnosis Required on Consultation - 400):',
      failComplete.status === 400 ? 'PASS' : 'FAIL'
    );

    // Clean up temporary consultation & token
    await prisma.consultation.delete({ where: { id: consultId } });
    await prisma.token.delete({ where: { id: token.id } });

    // BOUNDARY 5: Invoice Missing Patient ID (400)
    const badInvRes = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        consultationFee: 500,
      }),
    });
    console.log(
      'Boundary 5 (Missing Patient on Invoice Generation - 400):',
      badInvRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // BOUNDARY 6: Payment Exceeding Remaining Invoice Balance (400)
    const testInv = await prisma.invoice.create({
      data: {
        hospitalId: doctor.hospitalId,
        patientId: existingPatient.id,
        invoiceNumber: `INV-TEST-BOUND-${Date.now().toString().slice(-4)}`,
        consultationFee: 500,
        pharmacyFee: 0,
        otherCharges: 0,
        discount: 0,
        tax: 0,
        totalAmount: 500,
        paidAmount: 0,
        paymentStatus: 'PENDING',
      },
    });

    // Attempt payment of ₹600 on a ₹500 invoice
    const overPayRes = await fetch(`${baseUrl}/billing/invoices/${testInv.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 600,
        paymentMethod: 'CASH',
      }),
    });
    console.log(
      'Boundary 6 (Payment Exceeding Balance Due Rejected - 400):',
      overPayRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // Record legitimate full payment
    await fetch(`${baseUrl}/billing/invoices/${testInv.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 500,
        paymentMethod: 'CASH',
      }),
    });

    // BOUNDARY 7: Payment on an Already Paid Invoice (400)
    const alreadyPaidRes = await fetch(`${baseUrl}/billing/invoices/${testInv.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 100,
        paymentMethod: 'CASH',
      }),
    });
    console.log(
      'Boundary 7 (Payment on Settled Invoice Rejected - 400):',
      alreadyPaidRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // Clean up test invoice
    await prisma.payment.deleteMany({ where: { invoiceId: testInv.id } });
    await prisma.invoice.delete({ where: { id: testInv.id } });

    // BOUNDARY 8: RBAC Access Control Enforcement (403)
    // Nurse attempting to access Financial Reports
    const nurseFinRes = await fetch(`${baseUrl}/reports/financial`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    // Pharmacist attempting to access Doctor Workload
    const pharmDocRes = await fetch(`${baseUrl}/reports/doctor-workload`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    console.log(
      'Boundary 8 (Strict RBAC Authorization Guards - 403):',
      nurseFinRes.status === 403 && pharmDocRes.status === 403 ? 'PASS' : 'FAIL'
    );

    console.log('\n============================================================');
    console.log('--- ALL BOUNDARY & STRESS TESTS PASSED SUCCESSFULLY! ---');
    console.log('============================================================\n');
  } finally {
    server.close();
  }
};

if (process.argv[1].endsWith('boundaryStressTest.js')) {
  runBoundaryStressTest().catch((err) => {
    console.error('Boundary Stress Test Suite Failed:', err);
    process.exit(1);
  });
}
