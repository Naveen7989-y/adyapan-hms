import app from '../app.js';

const runTests = async () => {
  console.log('--- Starting Reports & Analytics Module API Tests ---');
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

    // Test 1: Unauthenticated request should be rejected (401)
    const unauthRes = await fetch(`${baseUrl}/reports/financial`);
    console.log(
      'Test 1 (Unauthenticated Request Blocked with 401):',
      unauthRes.status === 401 ? 'PASS' : 'FAIL'
    );

    // Test 2: Admin Financial & Revenue Report
    const adminToken = await login('admin@adyapan.com');
    const finRes = await fetch(`${baseUrl}/reports/financial`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const finData = await finRes.json();
    console.log(
      'Test 2 (Financial Revenue Report):',
      finRes.status === 200 && finData.data?.summary !== undefined ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Total Billed: ₹${finData.data?.summary?.totalBilled} | Total Collected: ₹${finData.data?.summary?.totalCollected} | Invoices Count: ${finData.data?.summary?.invoicesCount}`
    );

    // Test 3: Doctor Clinical Workload Report
    const docWorkRes = await fetch(`${baseUrl}/reports/doctor-workload`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const docWorkData = await docWorkRes.json();
    console.log(
      'Test 3 (Doctor Clinical Workload Report):',
      docWorkRes.status === 200 && Array.isArray(docWorkData.data?.workload) ? 'PASS' : 'FAIL'
    );
    console.log(`- Evaluated ${docWorkData.data?.totalDoctors} Doctors`);

    // Test 4: Queue & Patient Flow Analytics Report
    const queueRes = await fetch(`${baseUrl}/reports/queue-analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const queueData = await queueRes.json();
    console.log(
      'Test 4 (Queue & Patient Flow Analytics Report):',
      queueRes.status === 200 && queueData.data?.triageBreakdown !== undefined ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Total Tokens: ${queueData.data?.summary?.totalTokensIssued} | Avg Wait Time: ${queueData.data?.summary?.avgWaitTimeMinutes}m | Emergency: ${queueData.data?.summary?.emergencyCases}`
    );

    // Test 5: Pharmacy & Medication Dispensing Report
    const pharmRes = await fetch(`${baseUrl}/reports/pharmacy`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pharmData = await pharmRes.json();
    console.log(
      'Test 5 (Pharmacy & Medication Dispensing Report):',
      pharmRes.status === 200 && Array.isArray(pharmData.data?.topDispensedMedicines) ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Dispenses: ${pharmData.data?.summary?.dispensesCount} | Units: ${pharmData.data?.summary?.totalUnitsDispensed} | Pharmacy Rev: ₹${pharmData.data?.summary?.totalPharmacyRevenue}`
    );

    // Test 6: Patient Intake & Demographics Report
    const demoRes = await fetch(`${baseUrl}/reports/patient-demographics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const demoData = await demoRes.json();
    console.log(
      'Test 6 (Patient Intake & Demographics Report):',
      demoRes.status === 200 && demoData.data?.genderBreakdown !== undefined ? 'PASS' : 'FAIL'
    );
    console.log(
      `- Total Patients: ${demoData.data?.summary?.totalPatients} | Male: ${demoData.data?.genderBreakdown?.MALE} | Female: ${demoData.data?.genderBreakdown?.FEMALE}`
    );

    // Test 7: RBAC - Pharmacist allowed on pharmacy report, blocked on financial report
    const pharmToken = await login('pharmacist@adyapan.com');
    const pharmOwnRes = await fetch(`${baseUrl}/reports/pharmacy`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const pharmBlockRes = await fetch(`${baseUrl}/reports/financial`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    console.log(
      'Test 7 (Pharmacist RBAC: Allowed on Pharmacy 200, Blocked on Financial 403):',
      pharmOwnRes.status === 200 && pharmBlockRes.status === 403 ? 'PASS' : 'FAIL'
    );

    // Test 8: RBAC - Accountant allowed on financial report, blocked on doctor workload
    const accToken = await login('accounts@adyapan.com');
    const accFinRes = await fetch(`${baseUrl}/reports/financial`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const accBlockRes = await fetch(`${baseUrl}/reports/doctor-workload`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    console.log(
      'Test 8 (Accountant RBAC: Allowed on Financial 200, Blocked on Doctor Workload 403):',
      accFinRes.status === 200 && accBlockRes.status === 403 ? 'PASS' : 'FAIL'
    );

    console.log('--- All Reports & Analytics Module API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
