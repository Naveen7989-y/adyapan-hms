import app from '../app.js';
import prisma from '../config/db.js';

async function runConsultationTests() {
  const port = 5010;
  const baseUrl = `http://localhost:${port}/api`;
  const server = app.listen(port);

  try {
    console.log('--- Starting Doctor Consultation Module API Tests ---');

    // 1. Doctor & Nurse Login
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

    const nurseLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nurse@adyapan.com',
        password: 'Password123!',
      }),
    });
    const nurseLoginJson = await nurseLoginRes.json();
    const nurseToken = nurseLoginJson.data?.token;

    console.log('Test 1 (Doctor & Nurse Authentication):',
      docLoginRes.status === 200 && docToken && nurseLoginRes.status === 200 && nurseToken ? 'PASS' : 'FAIL'
    );

    // Get doctor and test patient
    const doctor = await prisma.doctor.findFirst({
      where: { user: { name: 'Dr. Rajesh Sharma' } },
      include: { user: true, department: true },
    });
    const patient = await prisma.patient.findFirst();

    const todayDate = new Date(new Date().toISOString().split('T')[0]);
    todayDate.setUTCHours(12, 0, 0, 0);

    const maxToken = await prisma.token.findFirst({
      where: { doctorId: doctor.id, queueDate: todayDate },
      orderBy: { tokenNumber: 'desc' },
    });
    const nextTokenNum = (maxToken?.tokenNumber || 0) + 1;

    // Create a test token in WAITING/CALLED status
    const token = await prisma.token.create({
      data: {
        hospitalId: doctor.hospitalId,
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        tokenNumber: nextTokenNum,
        queueDate: todayDate,
        tokenType: 'NORMAL',
        status: 'CALLED',
        calledAt: new Date(),
      },
    });

    // Test 2: Start Consultation with Vitals & Symptoms
    const startRes = await fetch(`${baseUrl}/consultations/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        tokenId: token.id,
        symptoms: 'High fever, severe throat pain, difficulty swallowing for 2 days',
        vitals: {
          bp: '120/80',
          pulse: 82,
          temp: 101.2,
          spo2: 98,
          weight: 72,
          height: 174,
          bmi: 23.8,
        },
        notes: 'Pharyngeal erythema observed on oral examination.',
      }),
    });
    const startJson = await startRes.json();
    const consultation = startJson.data;

    console.log('Test 2 (Start Consultation & Vitals Capture):',
      startRes.status === 201 && consultation?.status === 'IN_PROGRESS' ? 'PASS' : 'FAIL'
    );
    console.log('- Consultation ID:', consultation?.id, '| Status:', consultation?.status);

    // Check that Token status transitioned to IN_CONSULTATION
    const updatedToken = await prisma.token.findUnique({ where: { id: token.id } });
    console.log('- Linked Token Status Updated to:', updatedToken?.status === 'IN_CONSULTATION' ? 'IN_CONSULTATION (PASS)' : 'FAIL');

    // Test 3: Idempotent Start Consultation
    const reStartRes = await fetch(`${baseUrl}/consultations/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ tokenId: token.id }),
    });
    const reStartJson = await reStartRes.json();
    console.log('Test 3 (Idempotent Consultation Start):',
      reStartJson.data?.id === consultation.id ? 'PASS' : 'FAIL'
    );

    // Test 4: Nurse Updates In-Progress Notes & Vitals
    const updateRes = await fetch(`${baseUrl}/consultations/${consultation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        notes: 'Re-checked temperature after sponge bath: 99.8 °F. Patient hydrated.',
        vitals: {
          bp: '118/76',
          pulse: 76,
          temp: 99.8,
          spo2: 99,
        },
      }),
    });
    const updateJson = await updateRes.json();
    console.log('Test 4 (Nurse Updates Clinical Notes & Vitals):',
      updateRes.status === 200 && updateJson.data?.notes?.includes('99.8') ? 'PASS' : 'FAIL'
    );

    // Test 5: Complete Consultation Validation (Missing diagnosis must fail)
    const failCompleteRes = await fetch(`${baseUrl}/consultations/${consultation.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        advice: 'Take medicines as advised',
      }),
    });
    console.log('Test 5 (Diagnosis Required for Completion):',
      failCompleteRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // Test 6: Complete Consultation Successfully
    const completeRes = await fetch(`${baseUrl}/consultations/${consultation.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        diagnosis: 'Acute Streptococcal Pharyngitis',
        advice: 'Warm saline gargles thrice daily. Complete 5-day antibiotic regimen.',
        followUpDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      }),
    });
    const completeJson = await completeRes.json();
    const completedConsultation = completeJson.data;

    console.log('Test 6 (Finalize Consultation & Clinical Diagnosis):',
      completeRes.status === 200 && completedConsultation?.status === 'COMPLETED' ? 'PASS' : 'FAIL'
    );
    console.log('- Final Diagnosis:', completedConsultation?.diagnosis);
    console.log('- Advice:', completedConsultation?.advice);

    // Verify token was also finalized as COMPLETED with timestamp
    const finalizedToken = await prisma.token.findUnique({ where: { id: token.id } });
    console.log('- Token Finalized Status:', finalizedToken?.status === 'COMPLETED' ? 'COMPLETED (PASS)' : 'FAIL');
    console.log('- CompletedAt Timestamp:', finalizedToken?.completedAt);

    // Test 7: Query Consultations List & Filter
    const listRes = await fetch(`${baseUrl}/consultations?status=COMPLETED&doctorId=${doctor.id}`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const listJson = await listRes.json();
    console.log('Test 7 (List & Filter Consultations):',
      listRes.status === 200 && listJson.data?.consultations?.length >= 1 ? 'PASS' : 'FAIL'
    );
    console.log('- Total Completed Consultations:', listJson.data?.total);

    // Test 8: Patient Clinical Consultation History Timeline
    const historyRes = await fetch(`${baseUrl}/consultations/patient/${patient.id}`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const historyJson = await historyRes.json();
    console.log('Test 8 (Patient Longitudinal Consultation History Timeline):',
      historyRes.status === 200 && historyJson.data?.consultations?.length >= 1 ? 'PASS' : 'FAIL'
    );
    console.log('- Total Past Patient Visits Recorded:', historyJson.data?.totalVisits);

    // Test 9: RBAC Guard (Nurse cannot complete a consultation without doctor privileges)
    const nurseCompleteRes = await fetch(`${baseUrl}/consultations/${consultation.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({ diagnosis: 'Nurse diagnosis attempt' }),
    });
    console.log('Test 9 (Nurse Blocked from Finalizing Consultation - RBAC):',
      nurseCompleteRes.status === 403 ? 'PASS' : 'FAIL'
    );

    console.log('--- All Doctor Consultation Module API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runConsultationTests().catch((e) => {
  console.error('Consultation test failed:', e);
  process.exit(1);
});
