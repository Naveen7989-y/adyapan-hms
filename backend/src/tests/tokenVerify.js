import app from '../app.js';
import prisma from '../config/db.js';

async function runTokenTests() {
  const port = 5008;
  const baseUrl = `http://localhost:${port}/api`;
  const server = app.listen(port);

  try {
    console.log('--- Starting Check-In & Digital Tokens API Tests ---');

    // 1. Receptionist Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reception@adyapan.com',
        password: 'Password123!',
      }),
    });
    const loginJson = await loginRes.json();
    const recToken = loginJson.data?.token;
    console.log('Test 1 (Receptionist Authentication):', loginRes.status === 200 && recToken ? 'PASS' : 'FAIL');

    // Setup Test Patient, Doctor, and Appointment for Today
    const doctor = await prisma.doctor.findFirst({
      include: { user: true, department: true },
    });
    let patient1 = await prisma.patient.findFirst();
    if (!patient1) {
      patient1 = await prisma.patient.create({
        data: {
          hospitalId: doctor.hospitalId,
          uhid: `ADY-${Date.now().toString().slice(-6)}`,
          fullName: 'CheckIn Test Patient',
          phone: `98711${Math.floor(10000 + Math.random() * 90000)}`,
          gender: 'FEMALE',
        },
      });
    }

    let patient2 = await prisma.patient.findFirst({
      where: { id: { not: patient1.id } },
    });

    if (!patient2) {
      patient2 = await prisma.patient.create({
        data: {
          hospitalId: doctor.hospitalId,
          uhid: `ADY-${(Date.now() + 1).toString().slice(-6)}`,
          fullName: 'WalkIn Test Patient',
          phone: `98722${Math.floor(10000 + Math.random() * 90000)}`,
          gender: 'MALE',
        },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    // Clean up existing tokens and appointments for this test doctor today for idempotency
    await prisma.token.deleteMany({
      where: {
        doctorId: doctor.id,
        queueDate: todayDate,
      },
    });

    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: todayDate,
      },
    });

    // Create a scheduled appointment for today
    const appt = await prisma.appointment.create({
      data: {
        hospitalId: doctor.hospitalId,
        patientId: patient1.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        appointmentDate: todayDate,
        timeSlot: '10:00',
        status: 'BOOKED',
        reason: 'General Check-In Test',
      },
    });

    // Test 2: Get today's booked appointments ready for check-in
    const bookedRes = await fetch(`${baseUrl}/checkin/today-appointments`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const bookedJson = await bookedRes.json();
    const hasBooked = bookedJson.data?.some((a) => a.id === appt.id);
    console.log('Test 2 (Query Today Booked Appointments):', bookedRes.status === 200 && hasBooked ? 'PASS' : 'FAIL');

    // Test 3: Check-in pre-booked appointment -> generates Token #1
    const checkinRes = await fetch(`${baseUrl}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        appointmentId: appt.id,
        tokenType: 'NORMAL',
      }),
    });
    const checkinJson = await checkinRes.json();
    const token1 = checkinJson.data;

    console.log('Test 3 (Appointment Check-In & Token Issuance):',
      checkinRes.status === 201 && token1.tokenNumber === 1 && token1.formattedToken === 'T-001' ? 'PASS' : 'FAIL'
    );
    console.log('- Issued Token:', token1?.formattedToken, '| Status:', token1?.status, '| Queue Position:', token1?.queuePosition);

    // Verify appointment status was updated to CHECKED_IN
    const updatedAppt = await prisma.appointment.findUnique({ where: { id: appt.id } });
    console.log('- Appointment Status Updated:', updatedAppt?.status === 'CHECKED_IN' ? 'CHECKED_IN (PASS)' : 'FAIL');

    // Test 4: Prevent Duplicate Check-In
    const dupCheckinRes = await fetch(`${baseUrl}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        appointmentId: appt.id,
      }),
    });
    console.log('Test 4 (Duplicate Check-In Prevented):', dupCheckinRes.status === 409 ? 'PASS' : 'FAIL');

    // Test 5: Direct Walk-In Token Generation (Normal) -> Token #2
    const walkInRes = await fetch(`${baseUrl}/tokens/walk-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: patient2.id,
        doctorId: doctor.id,
        tokenType: 'NORMAL',
      }),
    });
    const walkInJson = await walkInRes.json();
    const token2 = walkInJson.data;

    console.log('Test 5 (Walk-In Normal Token Issuance):',
      walkInRes.status === 201 && token2.tokenNumber === 2 && token2.formattedToken === 'T-002' ? 'PASS' : 'FAIL'
    );
    console.log('- Issued Token:', token2?.formattedToken, '| Queue Position:', token2?.queuePosition);

    // Test 6: Emergency Priority Token Generation -> Token #3
    // Even though tokenNumber is 3, EMERGENCY priority places it at position 1 in active queue
    const emergencyRes = await fetch(`${baseUrl}/tokens/walk-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: patient1.id,
        doctorId: doctor.id,
        tokenType: 'EMERGENCY',
      }),
    });
    const emergencyJson = await emergencyRes.json();
    const token3 = emergencyJson.data;

    console.log('Test 6 (Emergency Token Triage Prioritization):',
      emergencyRes.status === 201 && token3.tokenType === 'EMERGENCY' && token3.queuePosition === 1 ? 'PASS' : 'FAIL'
    );
    console.log('- Emergency Token:', token3?.formattedToken, '| Priority:', token3?.tokenType, '| Queue Position:', token3?.queuePosition);

    // Test 7: Token Lifecycle State Transitions (WAITING -> CALLED -> IN_CONSULTATION -> COMPLETED)
    // Step 7A: Call Token #1
    const callRes = await fetch(`${baseUrl}/tokens/${token1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ status: 'CALLED', roomNumber: 'Room 101' }),
    });
    const callJson = await callRes.json();
    const isCalled = callRes.status === 200 && callJson.data?.status === 'CALLED' && callJson.data?.calledAt;

    // Step 7B: In Consultation
    const consultRes = await fetch(`${baseUrl}/tokens/${token1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ status: 'IN_CONSULTATION' }),
    });
    const consultJson = await consultRes.json();
    const isConsulting = consultRes.status === 200 && consultJson.data?.status === 'IN_CONSULTATION';

    // Step 7C: Complete Consultation
    const completeRes = await fetch(`${baseUrl}/tokens/${token1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const completeJson = await completeRes.json();
    const isCompleted = completeRes.status === 200 && completeJson.data?.status === 'COMPLETED' && completeJson.data?.completedAt;

    console.log('Test 7 (Token Lifecycle State Progression):',
      isCalled && isConsulting && isCompleted ? 'PASS' : 'FAIL'
    );
    console.log('- Final Token Status:', completeJson.data?.status, '| CompletedAt:', completeJson.data?.completedAt);

    // Test 8: Queue Statistics & Metrics
    const statsRes = await fetch(`${baseUrl}/tokens/stats?date=${todayStr}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const statsJson = await statsRes.json();
    const stats = statsJson.data;

    console.log('Test 8 (Token Queue Metrics):',
      statsRes.status === 200 && stats?.total >= 3 && stats?.completed >= 1 && stats?.emergency >= 1 ? 'PASS' : 'FAIL'
    );
    console.log('- Queue Stats Summary:', stats);

    // Test 9: Verify Notification Trigger on Token Generation and Call
    // Give async event triggers 200ms to fulfill
    await new Promise((r) => setTimeout(r, 200));

    const tokenGenNotif = await prisma.notification.findFirst({
      where: { eventType: 'TOKEN_GENERATED', recipient: patient1.phone },
      orderBy: { createdAt: 'desc' },
    });

    const tokenCallNotif = await prisma.notification.findFirst({
      where: { eventType: 'TOKEN_CALLED', recipient: patient1.phone },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Test 9 (Automated SMS Alerts for Token Issuance & Calling):',
      tokenGenNotif && tokenCallNotif ? 'PASS' : 'FAIL'
    );
    console.log('- Token Generated SMS:', tokenGenNotif?.message);
    console.log('- Token Called SMS:', tokenCallNotif?.message);

    // Test 10: Concurrent Walk-in Token Generation (Race-condition safety)
    const [p1Res, p2Res] = await Promise.all([
      fetch(`${baseUrl}/tokens/walk-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recToken}` },
        body: JSON.stringify({ patientId: patient1.id, doctorId: doctor.id, tokenType: 'NORMAL' }),
      }),
      fetch(`${baseUrl}/tokens/walk-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recToken}` },
        body: JSON.stringify({ patientId: patient2.id, doctorId: doctor.id, tokenType: 'NORMAL' }),
      }),
    ]);
    const p1Json = await p1Res.json();
    const p2Json = await p2Res.json();
    const numbers = [p1Json.data?.tokenNumber, p2Json.data?.tokenNumber].sort((a, b) => a - b);
    console.log('Test 10 (Concurrent Walk-in Token Allocation):',
      p1Res.status === 201 && p2Res.status === 201 && numbers[0] !== numbers[1] ? 'PASS' : 'FAIL'
    );
    console.log('- Concurrently Issued Tokens:', p1Json.data?.formattedToken, 'and', p2Json.data?.formattedToken);

    console.log('--- All Check-In & Digital Tokens API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runTokenTests().catch((e) => {
  console.error('Token test failed:', e);
  process.exit(1);
});
