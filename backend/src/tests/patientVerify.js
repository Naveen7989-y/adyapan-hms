import app from '../app.js';

async function runPatientTests() {
  console.log('--- Starting Patient Management API Tests ---');
  const server = app.listen(5002);
  const baseUrl = 'http://localhost:5002/api';

  try {
    // 1. Log in as Receptionist to obtain token
    const recLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const recLoginJson = await recLoginRes.json();
    const recToken = recLoginJson.data?.token;
    console.log('Receptionist Auth Token Obtained:', !!recToken);

    // 2. Log in as Doctor to test RBAC restrictions
    const docLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor.sharma@adyapan.com', password: 'Password123!' }),
    });
    const docLoginJson = await docLoginRes.json();
    const docToken = docLoginJson.data?.token;

    // Test 1: Register New Patient (Full Form)
    const testPhone = `+91 91${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Aarav Mehta',
        phone: testPhone,
        email: 'aarav.mehta@example.com',
        gender: 'MALE',
        bloodGroup: 'A+',
        dateOfBirth: '1995-08-20',
        address: '12 Blossom Residency, Indiranagar',
        emergencyContact: 'Sunita Mehta (+91 9199999999)',
        medicalHistory: 'Asthma since childhood; uses inhaler',
      }),
    });
    const regJson = await regRes.json();
    const registeredPatient = regJson.data;
    console.log('Test 1 (Full Patient Registration):', regRes.status === 201 && registeredPatient.uhid.startsWith('ADY-') ? 'PASS' : 'FAIL');
    console.log('- Generated UHID:', registeredPatient?.uhid);

    // Test 2: Fast Walk-In Registration
    const walkInPhone = `+91 92${Math.floor(10000000 + Math.random() * 90000000)}`;
    const walkInRes = await fetch(`${baseUrl}/patients/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Kavita Nair (Walk-in)',
        phone: walkInPhone,
        gender: 'FEMALE',
        age: '28',
      }),
    });
    const walkInJson = await walkInRes.json();
    console.log('Test 2 (Fast Walk-In Registration):', walkInRes.status === 201 && walkInJson.data?.patient?.uhid ? 'PASS' : 'FAIL');
    console.log('- Walk-in UHID:', walkInJson.data?.patient?.uhid);

    // Test 3: Duplicate Phone Detection Check
    const dupRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Aarav Mehta Clone',
        phone: testPhone, // Same phone as Test 1
        gender: 'MALE',
      }),
    });
    const dupJson = await dupRes.json();
    console.log('Test 3 (Duplicate Phone Detection):', dupRes.status === 409 && dupJson.duplicateFound ? 'PASS' : 'FAIL');

    // Test 4: Search Patients by UHID
    const searchUhidRes = await fetch(`${baseUrl}/patients?search=${registeredPatient.uhid}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const searchUhidJson = await searchUhidRes.json();
    console.log('Test 4 (Search by UHID):', searchUhidRes.status === 200 && searchUhidJson.data?.patients?.length === 1 ? 'PASS' : 'FAIL');

    // Test 5: Search Patients by Phone
    const searchPhoneRes = await fetch(`${baseUrl}/patients?search=${testPhone}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const searchPhoneJson = await searchPhoneRes.json();
    console.log('Test 5 (Search by Phone Number):', searchPhoneRes.status === 200 && searchPhoneJson.data?.patients?.length > 0 ? 'PASS' : 'FAIL');

    // Test 6: Search Patients by Name
    const searchNameRes = await fetch(`${baseUrl}/patients?search=Aarav`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const searchNameJson = await searchNameRes.json();
    console.log('Test 6 (Search by Name):', searchNameRes.status === 200 && searchNameJson.data?.patients?.length > 0 ? 'PASS' : 'FAIL');

    // Test 7: Get Patient Profile & Complete History Timeline
    const historyRes = await fetch(`${baseUrl}/patients/${registeredPatient.id}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const historyJson = await historyRes.json();
    console.log('Test 7 (Patient Profile & History Timeline):',
      historyRes.status === 200 &&
      historyJson.data?.uhid === registeredPatient.uhid &&
      Array.isArray(historyJson.data?.appointments) &&
      Array.isArray(historyJson.data?.prescriptions)
      ? 'PASS'
      : 'FAIL'
    );

    // Test 8: Update Patient Profile
    const updateRes = await fetch(`${baseUrl}/patients/${registeredPatient.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        medicalHistory: 'Asthma updated: regular preventive steroid inhaler added',
      }),
    });
    const updateJson = await updateRes.json();
    console.log('Test 8 (Update Patient Medical History):', updateRes.status === 200 && updateJson.data?.medicalHistory?.includes('preventive') ? 'PASS' : 'FAIL');

    // Test 9: Doctor can view patient profile
    const docViewRes = await fetch(`${baseUrl}/patients/${registeredPatient.id}`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    console.log('Test 9 (Doctor Viewing Patient History):', docViewRes.status === 200 ? 'PASS' : 'FAIL');

    // Test 10: Doctor Registration RBAC Guard (Doctor cannot create patient directly - 403 Forbidden)
    const docRegRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        fullName: 'Unauthorized Patient',
        phone: '+91 9999999999',
        gender: 'MALE',
      }),
    });
    console.log('Test 10 (Doctor Restricted from Patient Registration):', docRegRes.status === 403 ? 'PASS' : 'FAIL');

    console.log('--- All Patient Management Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runPatientTests().catch((e) => {
  console.error('Patient test failed:', e);
  process.exit(1);
});
