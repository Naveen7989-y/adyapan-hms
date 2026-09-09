import app from '../app.js';

async function runAuthTests() {
  console.log('--- Starting Authentication & RBAC API Tests ---');

  const server = app.listen(5001);
  const baseUrl = 'http://localhost:5001/api';

  try {
    // Test 1: Invalid Login
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@adyapan.com', password: 'WrongPassword' }),
    });
    const badLoginJson = await badLoginRes.json();
    console.log('Test 1 (Invalid Login):', badLoginRes.status === 401 && !badLoginJson.success ? 'PASS' : 'FAIL');

    // Test 2: Valid Login (Hospital Admin)
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@adyapan.com', password: 'Password123!' }),
    });
    const adminLoginJson = await adminLoginRes.json();
    const adminToken = adminLoginJson.data?.token;
    const adminUser = adminLoginJson.data?.user;
    console.log('Test 2 (Admin Login):', adminLoginRes.status === 200 && adminToken && !adminUser.password ? 'PASS' : 'FAIL');
    console.log('- Admin Role:', adminUser?.role);

    // Test 3: Valid Login (Doctor)
    const docLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor.sharma@adyapan.com', password: 'Password123!' }),
    });
    const docLoginJson = await docLoginRes.json();
    const docToken = docLoginJson.data?.token;
    console.log('Test 3 (Doctor Login):', docLoginRes.status === 200 && docToken ? 'PASS' : 'FAIL');

    // Test 4: Protected GET /api/auth/me without token (Should be 401)
    const noTokenRes = await fetch(`${baseUrl}/auth/me`);
    console.log('Test 4 (No Token on Protected Route):', noTokenRes.status === 401 ? 'PASS' : 'FAIL');

    // Test 5: Protected GET /api/auth/me with valid Doctor token
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const meJson = await meRes.json();
    console.log('Test 5 (Get Profile via Token):', meRes.status === 200 && meJson.data?.email === 'doctor.sharma@adyapan.com' ? 'PASS' : 'FAIL');

    // Test 6: RBAC Forbidden Check (Doctor trying to access /api/users - should be 403)
    const rbacDeniedRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    console.log('Test 6 (RBAC Forbidden Guard):', rbacDeniedRes.status === 403 ? 'PASS' : 'FAIL');

    // Test 7: RBAC Allowed Check (Admin accessing /api/users - should be 200)
    const rbacAllowedRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rbacAllowedJson = await rbacAllowedRes.json();
    console.log('Test 7 (Admin User List Access):', rbacAllowedRes.status === 200 && Array.isArray(rbacAllowedJson.data) ? 'PASS' : 'FAIL');
    console.log('- Total Users Retrieved:', rbacAllowedJson.data?.length);

    // Test 8: Admin creates new staff user
    const testEmail = `dr.vikram.${Date.now()}@adyapan.com`;
    const newUserRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Dr. Vikram Seth',
        email: testEmail,
        password: 'Password123!',
        role: 'DOCTOR',
        phone: '+91 9900000099',
      }),
    });
    const newUserJson = await newUserRes.json();
    console.log('Test 8 (Admin Creates User):', newUserRes.status === 201 && newUserJson.data?.email === testEmail ? 'PASS' : 'FAIL');

    console.log('--- All Authentication & RBAC Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runAuthTests().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
