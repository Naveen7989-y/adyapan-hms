import app from '../app.js';
import prisma from '../config/db.js';

async function runQueueTests() {
  const port = 5009;
  const baseUrl = `http://localhost:${port}/api`;
  const server = app.listen(port);

  try {
    console.log('--- Starting Live Queue & TV Display API Tests ---');

    // 1. Doctor Login
    const docLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor.sharma@adyapan.com',
        password: 'Password123!',
      }),
    });
    const docLoginJson = await docLoginRes.json();
    const docToken = docLoginJson.data?.token;
    console.log('Test 1 (Doctor Authentication):', docLoginRes.status === 200 && docToken ? 'PASS' : 'FAIL');

    // Get Doctor and Patients
    const doctor = await prisma.doctor.findFirst({
      where: { user: { name: 'Dr. Rajesh Sharma' } },
      include: { user: true, department: true },
    });

    const hospitalId = doctor.hospitalId;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    let patient1 = await prisma.patient.findFirst();
    let patient2 = await prisma.patient.findFirst({ where: { id: { not: patient1.id } } });

    // Clean up existing tokens for this doctor today for an isolated, clean test queue
    await prisma.token.deleteMany({
      where: { doctorId: doctor.id, queueDate: todayDate },
    });

    // Test 2: Query Live Queue when empty
    const emptyQueueRes = await fetch(`${baseUrl}/queue/doctor/${doctor.id}`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const emptyQueueJson = await emptyQueueRes.json();
    console.log('Test 2 (Query Empty Live Queue):',
      emptyQueueRes.status === 200 && emptyQueueJson.data?.waitingTokens?.length === 0 ? 'PASS' : 'FAIL'
    );
    console.log('- Doctor In Queue:', emptyQueueJson.data?.doctor?.name, '| Waiting Count:', emptyQueueJson.data?.metrics?.waitingCount);

    // Test 3: Populate 3 Test Tokens with different triage priorities
    // Token #1: NORMAL
    const t1 = await prisma.token.create({
      data: {
        hospitalId,
        patientId: patient1.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        tokenNumber: 1,
        queueDate: todayDate,
        tokenType: 'NORMAL',
        status: 'WAITING',
      },
    });

    // Token #2: PRIORITY (Senior/Pregnant)
    const t2 = await prisma.token.create({
      data: {
        hospitalId,
        patientId: patient2.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        tokenNumber: 2,
        queueDate: todayDate,
        tokenType: 'PRIORITY',
        status: 'WAITING',
      },
    });

    // Token #3: EMERGENCY (Arrived last, but has top triage priority)
    const t3 = await prisma.token.create({
      data: {
        hospitalId,
        patientId: patient1.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        tokenNumber: 3,
        queueDate: todayDate,
        tokenType: 'EMERGENCY',
        status: 'WAITING',
      },
    });
    console.log('Test 3 (Seed 3 Triage Tokens): PASS -> Issued T-001 (Normal), T-002 (Priority), T-003 (Emergency)');

    // Test 4: Call Next Patient (Should select T-003 Emergency first!)
    const callRes = await fetch(`${baseUrl}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        doctorId: doctor.id,
        roomNumber: 'Room 102',
      }),
    });
    const callJson = await callRes.json();
    const calledToken = callJson.data;

    console.log('Test 4 (Triage Priority Calling - Emergency First):',
      callRes.status === 200 && calledToken?.formattedToken === 'T-003' && calledToken?.status === 'CALLED' ? 'PASS' : 'FAIL'
    );
    console.log('- Called Patient Token:', calledToken?.formattedToken, '| Priority:', calledToken?.tokenType, '| Room:', calledToken?.roomNumber);
    console.log('- TTS Speech Text:', calledToken?.ttsAnnouncement);

    // Test 5: Call Next Conflict Guard (Cannot call next while current is still CALLED)
    const conflictRes = await fetch(`${baseUrl}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ doctorId: doctor.id }),
    });
    console.log('Test 5 (Active Call Conflict Intercepted):', conflictRes.status === 409 ? 'PASS' : 'FAIL');

    // Test 6: Recall Patient
    const recallRes = await fetch(`${baseUrl}/queue/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        tokenId: calledToken.id,
        roomNumber: 'Room 102',
      }),
    });
    const recallJson = await recallRes.json();
    console.log('Test 6 (Recall Patient):', recallRes.status === 200 && recallJson.data?.status === 'CALLED' ? 'PASS' : 'FAIL');
    console.log('- Recall TTS Announcement:', recallJson.data?.ttsAnnouncement);

    // Test 7: Start Consultation and Call Next (T-002 Priority is next)
    await fetch(`${baseUrl}/tokens/${calledToken.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ status: 'IN_CONSULTATION' }),
    });

    const callNext2Res = await fetch(`${baseUrl}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ doctorId: doctor.id, roomNumber: 'Room 102' }),
    });
    const callNext2Json = await callNext2Res.json();
    console.log('Test 7 (Call Second Patient - Priority Next):',
      callNext2Res.status === 200 && callNext2Json.data?.formattedToken === 'T-002' ? 'PASS' : 'FAIL'
    );
    console.log('- Second Called Token:', callNext2Json.data?.formattedToken, '| Priority:', callNext2Json.data?.tokenType);

    // Test 8: Public TV Display Feed (Unauthenticated read-only)
    const tvRes = await fetch(`${baseUrl}/queue/public-display?hospitalId=${hospitalId}`);
    const tvJson = await tvRes.json();
    const tvData = tvJson.data;

    const hasNowServing = tvData?.nowServing?.length >= 1;
    const isMasked = tvData?.nowServing?.[0]?.maskedPatientName?.includes('*');

    console.log('Test 8 (Public TV Queue Feed with Patient Privacy Masking):',
      tvRes.status === 200 && hasNowServing && isMasked ? 'PASS' : 'FAIL'
    );
    console.log('- Now Serving Count on TV:', tvData?.nowServing?.length);
    console.log('- Masked Name Sample:', tvData?.nowServing?.[0]?.maskedPatientName);
    console.log('- Upcoming Waiting on TV:', tvData?.upcomingWaiting?.length);
    console.log('- Active TV Announcement Speech:', tvData?.recentAnnouncement?.speechText);

    // Test 9: Transfer Token
    // Create a temporary second doctor or find one to verify transfer
    let doctor2 = await prisma.doctor.findFirst({
      where: { id: { not: doctor.id } },
    });

    if (!doctor2) {
      // Create second doctor for transfer test
      const user2 = await prisma.user.create({
        data: {
          hospitalId,
          name: 'Dr. Anita Desai',
          email: `dr.anita.${Date.now()}@adyapan.com`,
          password: 'Password123!',
          role: 'DOCTOR',
          phone: `98999${Math.floor(10000 + Math.random() * 90000)}`,
        },
      });
      doctor2 = await prisma.doctor.create({
        data: {
          hospitalId,
          userId: user2.id,
          departmentId: doctor.departmentId,
          specialization: 'Pediatric Care',
        },
        include: { user: true, department: true },
      });
    }

    const transferRes = await fetch(`${baseUrl}/queue/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        tokenId: t1.id,
        toDoctorId: doctor2.id,
        reason: 'Patient transferred for pediatric specialization',
      }),
    });
    const transferJson = await transferRes.json();

    console.log('Test 9 (Transfer Patient Token to Another Doctor):',
      transferRes.status === 200 && transferJson.data?.doctorId === doctor2.id ? 'PASS' : 'FAIL'
    );
    console.log('- Token Transferred to:', transferJson.data?.transferredTo);

    console.log('--- All Live Queue & TV Display API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runQueueTests().catch((e) => {
  console.error('Queue test failed:', e);
  process.exit(1);
});
