import app from '../app.js';
import prisma from '../config/db.js';

export const runConcurrencyStressTest = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING CONCURRENCY & RACE-CONDITION STRESS TESTS ---');
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
    const pharmToken = await login('pharmacist@adyapan.com');
    const accToken = await login('accounts@adyapan.com');

    // -------------------------------------------------------------
    // CONCURRENCY TEST 1: Concurrent Walk-In Token Generation
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Concurrent Token Issuance (Unique Numbers) ---');
    const doctor = await prisma.doctor.findFirst({
      include: { department: true, hospital: true },
    });

    // Create 5 unique test patients
    const patientIds = [];
    const timestamp = Date.now();
    for (let i = 0; i < 5; i++) {
      const p = await prisma.patient.create({
        data: {
          hospitalId: doctor.hospitalId,
          uhid: `UHID-CONC-${timestamp}-${i}`,
          fullName: `Concurrency Patient ${i}`,
          phone: `911${String(timestamp).slice(-7)}${i}`,
          gender: 'MALE',
        },
      });
      patientIds.push(p.id);
    }

    // Fire 5 concurrent walk-in token requests
    const tokenPromises = patientIds.map((pid, idx) =>
      fetch(`${baseUrl}/tokens/walk-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recToken}`,
        },
        body: JSON.stringify({
          patientId: pid,
          departmentId: doctor.departmentId,
          doctorId: doctor.id,
          priority: 'NORMAL',
        }),
      }).then((r) => r.json())
    );

    const tokenResults = await Promise.all(tokenPromises);
    const tokenNumbers = tokenResults
      .filter((r) => r.success && r.data?.tokenNumber)
      .map((r) => r.data.tokenNumber);

    const uniqueTokens = new Set(tokenNumbers);
    assert(
      'Concurrent Token Issuance No Collision',
      tokenNumbers.length === 5 && uniqueTokens.size === 5,
      `Issued tokens: [${tokenNumbers.join(', ')}] (5 unique sequential tokens expected)`
    );

    // -------------------------------------------------------------
    // CONCURRENCY TEST 2: Concurrent Appointment Slot Collision Prevention
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Concurrent Slot Booking Collision Prevention ---');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const schedDay = futureDate.getUTCDay();

    // Ensure schedule exists
    const existingSched = await prisma.doctorSchedule.findFirst({
      where: { doctorId: doctor.id, dayOfWeek: schedDay },
    });
    if (existingSched) {
      await prisma.doctorSchedule.update({
        where: { id: existingSched.id },
        data: { isActive: true },
      });
    } else {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: schedDay,
          startTime: '08:00',
          endTime: '18:00',
          slotDurationMinutes: 15,
          maxCapacity: 40,
          isActive: true,
        },
      });
    }

    const targetSlot = '15:30';
    // Clean any prior appointment in that slot
    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: new Date(futureDateStr),
        timeSlot: targetSlot,
      },
    });

    // Fire 3 simultaneous booking attempts for the identical slot
    const bookPromises = [patientIds[0], patientIds[1], patientIds[2]].map((pid) =>
      fetch(`${baseUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recToken}`,
        },
        body: JSON.stringify({
          patientId: pid,
          doctorId: doctor.id,
          departmentId: doctor.departmentId,
          appointmentDate: futureDateStr,
          timeSlot: targetSlot,
          type: 'CONSULTATION',
        }),
      }).then(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const bookResults = await Promise.all(bookPromises);
    const successBookings = bookResults.filter((r) => r.status === 201);
    const conflictBookings = bookResults.filter((r) => r.status === 409);

    assert(
      'Double Booking Collision Prevention',
      successBookings.length === 1 && conflictBookings.length === 2,
      `1 booking succeeded (201), 2 rejected with conflict (409)`
    );

    const bookedCountInDb = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: new Date(futureDateStr),
        timeSlot: targetSlot,
        status: { not: 'CANCELLED' },
      },
    });
    assert('Database Slot Integrity', bookedCountInDb === 1, `DB count: ${bookedCountInDb}`);

    // -------------------------------------------------------------
    // CONCURRENCY TEST 3: Concurrent Pharmacy Stock Deduction Limits
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Concurrent Pharmacy Stock Deduction Limits ---');
    // Create test medicine via Pharmacy API
    const medRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        name: `Paracetamol Concurrency ${timestamp}`,
        genericName: 'Paracetamol',
        categoryName: 'Analgesics',
        unit: 'TABLETS',
        minStockAlert: 2,
      }),
    });
    const medData = await medRes.json();
    const med = medData?.data;

    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 2);

    // Add batch with exactly 3 units
    const batchRes = await fetch(`${baseUrl}/pharmacy/medicines/${med.id}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        batchNumber: `BATCH-CONC-${timestamp}`,
        expiryDate: expDate.toISOString(),
        quantity: 3,
        purchasePrice: 2.0,
        sellingPrice: 5.0,
      }),
    });
    const batchData = await batchRes.json();
    const batch = batchData?.data;

    // Create 6 consultations and prescriptions for 1 unit each
    const prescList = [];
    for (let i = 0; i < 6; i++) {
      const cons = await prisma.consultation.create({
        data: {
          hospitalId: doctor.hospitalId,
          patientId: patientIds[i % patientIds.length],
          doctorId: doctor.id,
          diagnosis: `Concurrency Test Case ${i}`,
          status: 'COMPLETED',
        },
      });

      const pr = await prisma.prescription.create({
        data: {
          hospitalId: doctor.hospitalId,
          consultationId: cons.id,
          patientId: patientIds[i % patientIds.length],
          doctorId: doctor.id,
          prescriptionCode: `RX-CONC-${timestamp}-${i}`,
          status: 'ACTIVE',
          items: {
            create: [
              {
                medicineId: med.id,
                dosage: '500mg',
                frequency: '1-0-1',
                duration: '1 day',
                quantityPrescribed: 1,
              },
            ],
          },
        },
      });
      prescList.push(pr);
    }

    // Fire 6 concurrent dispense calls for stock of 3
    const dispensePromises = prescList.map((pr) =>
      fetch(`${baseUrl}/pharmacy/dispense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pharmToken}`,
        },
        body: JSON.stringify({
          prescriptionId: pr.id,
        }),
      }).then(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const dispenseResults = await Promise.all(dispensePromises);
    const successfulDispenses = dispenseResults.filter((r) => r.status === 200 || r.status === 201);
    const rejectedDispenses = dispenseResults.filter((r) => r.status === 400);

    assert(
      'Stock Exhaustion Bounds Under Concurrency',
      successfulDispenses.length === 3 && rejectedDispenses.length === 3,
      `Dispensed: ${successfulDispenses.length}, Rejected due to stock: ${rejectedDispenses.length}`
    );

    const updatedBatch = await prisma.medicineBatch.findUnique({
      where: { id: batch.id },
    });
    assert(
      'Stock Cannot Become Negative',
      updatedBatch.quantity === 0,
      `Final batch stock: ${updatedBatch.quantity} (Must be exactly 0)`
    );

    // -------------------------------------------------------------
    // CONCURRENCY TEST 4: Concurrent Refund Request Mathematical Bounds
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Concurrent Refund Mathematical Ledger Bounds ---');
    // Create an invoice of ₹500 via Billing API
    const invRes = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        patientId: patientIds[0],
        consultationFee: 500,
        items: [
          { description: 'Consultation Fee', quantity: 1, unitPrice: 500, totalPrice: 500 },
        ],
      }),
    });
    const invData = await invRes.json();
    const inv = invData?.data;

    // Record full payment of ₹500
    await fetch(`${baseUrl}/billing/invoices/${inv.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 500,
        paymentMethod: 'CASH',
        transactionRef: `CASH-CONC-${timestamp}`,
      }),
    });

    // Fire 2 concurrent refund requests of ₹350 each (total ₹700 > ₹500)
    const refundPromises = [1, 2].map((reqNum) =>
      fetch(`${baseUrl}/billing/invoices/${inv.id}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accToken}`,
        },
        body: JSON.stringify({
          amount: 350,
          reason: `Concurrent Refund Attempt ${reqNum}`,
          paymentMethod: 'CASH',
        }),
      }).then(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const refundResults = await Promise.all(refundPromises);
    const successfulRefunds = refundResults.filter((r) => r.status === 200 || r.status === 201);
    const rejectedRefunds = refundResults.filter((r) => r.status === 400);

    assert(
      'Over-Refund Prevented Under Concurrency',
      successfulRefunds.length === 1 && rejectedRefunds.length === 1,
      `Successful refunds: ${successfulRefunds.length}, Rejected over-refunds: ${rejectedRefunds.length}`
    );

    const updatedInv = await prisma.invoice.findUnique({
      where: { id: inv.id },
    });
    assert(
      'Invoice Refunded Balance Consistency',
      Number(updatedInv.refundedAmount) <= Number(updatedInv.paidAmount),
      `Refunded: ₹${updatedInv.refundedAmount} <= Paid: ₹${updatedInv.paidAmount}`
    );

    console.log('\n------------------------------------------------------------');
    console.log(`CONCURRENCY TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Concurrency stress test crashed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('concurrencyStressTest.js')) {
  runConcurrencyStressTest();
}
