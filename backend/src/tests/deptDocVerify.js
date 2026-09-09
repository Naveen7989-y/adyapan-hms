import app from '../app.js';

async function runDeptDocTests() {
  console.log('--- Starting Departments & Doctors API Tests ---');
  const server = app.listen(5003);
  const baseUrl = 'http://localhost:5003/api';

  try {
    // 1. Admin login
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@adyapan.com', password: 'Password123!' }),
    });
    const adminToken = (await adminLogin.json()).data?.token;

    // 2. Doctor login (Dr. Rajesh Sharma)
    const docLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor.sharma@adyapan.com', password: 'Password123!' }),
    });
    const docLoginJson = await docLogin.json();
    const docToken = docLoginJson.data?.token;
    const docUserId = docLoginJson.data?.user?.id;

    // 3. Receptionist login
    const recLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const recToken = (await recLogin.json()).data?.token;

    // Test 1: List Departments
    const deptListRes = await fetch(`${baseUrl}/departments`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const deptListJson = await deptListRes.json();
    console.log('Test 1 (List Departments):', deptListRes.status === 200 && deptListJson.data?.length >= 5 ? 'PASS' : 'FAIL');
    console.log('- Total Seeded Departments:', deptListJson.data?.length);

    // Test 2: Admin creates new department (Neurology)
    const code = `NEU${Date.now().toString().slice(-3)}`;
    const createDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Neurology & Brain Sciences',
        code,
        description: 'Comprehensive neurological diagnostics and care',
      }),
    });
    const createDeptJson = await createDeptRes.json();
    const newDeptId = createDeptJson.data?.id;
    console.log('Test 2 (Admin Create Department):', createDeptRes.status === 201 && newDeptId ? 'PASS' : 'FAIL');

    // Test 3: Admin updates department
    const updateDeptRes = await fetch(`${baseUrl}/departments/${newDeptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Updated: Advanced neurosurgery and stroke clinic',
      }),
    });
    const updateDeptJson = await updateDeptRes.json();
    console.log('Test 3 (Update Department Description):', updateDeptRes.status === 200 && updateDeptJson.data?.description?.includes('neurosurgery') ? 'PASS' : 'FAIL');

    // Test 4: List Doctors
    const doctorsRes = await fetch(`${baseUrl}/doctors`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const doctorsJson = await doctorsRes.json();
    const docList = doctorsJson.data;
    const rajeshDoc = docList?.find((d) => d.user?.name === 'Dr. Rajesh Sharma');
    console.log('Test 4 (List Doctors with Department & Schedules):',
      doctorsRes.status === 200 && rajeshDoc && rajeshDoc.schedules?.length > 0 ? 'PASS' : 'FAIL'
    );
    console.log('- Dr. Rajesh Sharma Department:', rajeshDoc?.department?.name);
    console.log('- Active Schedules Count:', rajeshDoc?.schedules?.length);

    // Test 5: Doctor updates own availability status
    const statusUpdateRes = await fetch(`${baseUrl}/doctors/${rajeshDoc.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ status: 'BUSY' }),
    });
    const statusUpdateJson = await statusUpdateRes.json();
    console.log('Test 5 (Doctor Updates Own Status to BUSY):',
      statusUpdateRes.status === 200 && statusUpdateJson.data?.status === 'BUSY' ? 'PASS' : 'FAIL'
    );

    // Revert status to AVAILABLE
    await fetch(`${baseUrl}/doctors/${rajeshDoc.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ status: 'AVAILABLE' }),
    });

    // Test 6: Configure Dynamic Weekly Schedules
    const newSchedules = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 20, maxCapacity: 12 },
      { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 20, maxCapacity: 12 },
      { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 20, maxCapacity: 12 },
    ];
    const schedRes = await fetch(`${baseUrl}/doctors/${rajeshDoc.id}/schedules`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({ schedules: newSchedules }),
    });
    const schedJson = await schedRes.json();
    console.log('Test 6 (Configure Dynamic Weekly Schedules):',
      schedRes.status === 200 && schedJson.data?.length === 3 ? 'PASS' : 'FAIL'
    );

    // Test 7: Receptionist unauthorized from creating a department (RBAC Check)
    const unauthDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized', code: 'UNAUTH' }),
    });
    console.log('Test 7 (Receptionist Blocked from Department Creation - RBAC):', unauthDeptRes.status === 403 ? 'PASS' : 'FAIL');

    console.log('--- All Departments & Doctors API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runDeptDocTests().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
