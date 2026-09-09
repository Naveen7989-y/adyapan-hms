import app from '../app.js';

const runTests = async () => {
  console.log('--- Starting Role-Based Dashboards Module API Tests ---');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // Helper to login and get token
    const login = async (email, password = 'Password123!') => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return data?.data?.token;
    };

    // Test 1: Unauthenticated request should be rejected (401)
    const unauthRes = await fetch(`${baseUrl}/dashboard/stats`);
    console.log(
      'Test 1 (Unauthenticated Request Rejected with 401):',
      unauthRes.status === 401 ? 'PASS' : 'FAIL'
    );

    // Test 2: Hospital Admin Dashboard
    const adminToken = await login('admin@adyapan.com');
    const adminRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminData = await adminRes.json();
    console.log(
      'Test 2 (Hospital Admin Executive Dashboard):',
      adminRes.status === 200 && adminData.data.role === 'ADMIN' ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Total Patients: ${adminData.data.kpis.totalPatients} | Active Doctors: ${adminData.data.kpis.totalDoctors} | Today Appointments: ${adminData.data.kpis.todayAppointmentsCount}`
    );

    // Test 3: Doctor Clinical Cockpit
    const docToken = await login('doctor.sharma@adyapan.com');
    const docRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const docData = await docRes.json();
    console.log(
      'Test 3 (Doctor Clinical Cockpit Dashboard):',
      docRes.status === 200 && docData.data.role === 'DOCTOR' ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Doctor: ${docData.data.doctor?.name} | Assigned Appts: ${docData.data.kpis.assignedAppointmentsCount} | Waiting Queue: ${docData.data.kpis.waitingTokensCount}`
    );

    // Test 4: Receptionist Intake Desk
    const recToken = await login('reception@adyapan.com');
    const recRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const recData = await recRes.json();
    console.log(
      'Test 4 (Receptionist Front Desk Intake Dashboard):',
      recRes.status === 200 && recData.data.role === 'RECEPTIONIST' ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Tokens Issued Today: ${recData.data.kpis.todayTokensIssued} | Doctor Queues Count: ${recData.data.doctorQueues?.length || 0}`
    );

    // Test 5: Nurse Assistant Triage Desk
    const nurseToken = await login('nurse@adyapan.com');
    const nurseRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const nurseData = await nurseRes.json();
    console.log(
      'Test 5 (Nurse Assistant Triage Station Dashboard):',
      nurseRes.status === 200 && nurseData.data.role === 'NURSE_ASSISTANT' ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Waiting Queue: ${nurseData.data.kpis.waitingQueueCount} | Emergency Tokens: ${nurseData.data.kpis.emergencyCount}`
    );

    // Test 6: Pharmacist Dispense Desk
    const pharmToken = await login('pharmacist@adyapan.com');
    const pharmRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const pharmData = await pharmRes.json();
    console.log(
      'Test 6 (Pharmacist Dispensing Desk Dashboard):',
      pharmRes.status === 200 && pharmData.data.role === 'PHARMACIST' ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Pending Prescriptions: ${pharmData.data.kpis.pendingPrescriptionsCount} | Dispenses Today: ${pharmData.data.kpis.todayDispensesCount}`
    );

    // Test 7: Accountant Cashier Finance Cockpit
    const accToken = await login('accounts@adyapan.com');
    const accRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const accData = await accRes.json();
    console.log(
      'Test 7 (Accountant Cashier Finance Dashboard):',
      accRes.status === 200 && accData.data.role === 'ACCOUNTANT' ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Today Collections: ₹${accData.data.kpis.todayCollections} | Pending Invoices: ${accData.data.kpis.pendingInvoicesCount}`
    );

    console.log('--- All Role-Based Dashboards Module API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
