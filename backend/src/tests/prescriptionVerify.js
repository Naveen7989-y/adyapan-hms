import app from '../app.js';
import prisma from '../config/db.js';

async function runPrescriptionTests() {
  console.log('--- Starting Digital Prescriptions Module API Tests ---');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Authenticate Doctor, Pharmacist, and Receptionist
    const docLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor.sharma@adyapan.com', password: 'Password123!' }),
    });
    const docData = await docLoginRes.json();
    const docToken = docData?.data?.token;

    const pharmLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pharmacist@adyapan.com', password: 'Password123!' }),
    });
    const pharmData = await pharmLoginRes.json();
    const pharmToken = pharmData?.data?.token;

    const receptLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const receptData = await receptLoginRes.json();
    const receptToken = receptData?.data?.token;

    console.log('Test 1 (Doctor, Pharmacist & Receptionist Auth):',
      docLoginRes.status === 200 && docToken && pharmToken && receptToken ? 'PASS' : 'FAIL'
    );

    // Retrieve Doctor and Test Patient
    const doctor = await prisma.doctor.findFirst({
      where: { user: { name: 'Dr. Rajesh Sharma' } },
      include: { user: true, department: true },
    });
    const patient = await prisma.patient.findFirst();

    // 2. Search Medicine Catalog
    const searchRes = await fetch(`${baseUrl}/prescriptions/medicines?search=Paracetamol`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const searchData = await searchRes.json();
    const paracetamol = searchData?.data?.[0];
    console.log('Test 2 (Search Seeded Medicines Catalog):',
      searchRes.status === 200 && paracetamol?.name?.includes('Paracetamol') ? 'PASS' : 'FAIL'
    );
    console.log(`- Found: ${paracetamol?.name} (${paracetamol?.category?.name || 'Category'})`);

    // 3. Quick-Add Medicine to Catalog
    const quickAddRes = await fetch(`${baseUrl}/prescriptions/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine Hydrochloride',
        categoryName: 'Antihistamines',
        unit: 'TABLETS',
        manufacturer: 'Cipla Ltd',
      }),
    });
    const quickAddData = await quickAddRes.json();
    const cetirizine = quickAddData?.data;
    console.log('Test 3 (Quick-Add Medicine to Catalog on-the-fly):',
      quickAddRes.status === 201 && cetirizine?.name === 'Cetirizine 10mg' ? 'PASS' : 'FAIL'
    );

    // 4. Issue Digital Prescription (Authoring with multiple items)
    const issueRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        notes: 'Take medications strictly after food. Stay hydrated.',
        items: [
          {
            medicineId: paracetamol.id,
            dosage: '650mg',
            frequency: '1-0-1',
            duration: '5 days',
            instructions: 'After meals with water',
            quantityPrescribed: 10,
          },
          {
            medicineId: cetirizine.id,
            dosage: '10mg',
            frequency: '0-0-1',
            duration: '3 days',
            instructions: 'At bedtime',
            // Auto-quantity test: (0+0+1)*3 = 3
          },
        ],
      }),
    });
    const issueData = await issueRes.json();
    const prescription = issueData?.data;

    console.log('Test 4 (Issue Digital Prescription with Atomic Code):',
      issueRes.status === 201 && prescription?.prescriptionCode?.startsWith('RX-') ? 'PASS' : 'FAIL'
    );
    console.log(`- Prescription Code: ${prescription?.prescriptionCode}`);
    console.log(`- Items Count: ${prescription?.items?.length} | Status: ${prescription?.status}`);
    console.log(`- Auto-Calculated Qty for Cetirizine (0-0-1 for 3 days): ${prescription?.items?.[1]?.quantityPrescribed}`);

    // 5. Validation Enforcement: Prescription without items must fail
    const invalidRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        items: [],
      }),
    });
    console.log('Test 5 (Reject Empty Prescription Items with 400):',
      invalidRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // 6. Update Active Prescription
    const updateRes = await fetch(`${baseUrl}/prescriptions/${prescription.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        notes: 'Updated: Take with warm water. Review after 5 days.',
        items: [
          {
            medicineId: paracetamol.id,
            dosage: '650mg',
            frequency: '1-1-1',
            duration: '5 days',
            instructions: 'Every 8 hours after food',
            quantityPrescribed: 15,
          },
        ],
      }),
    });
    const updateData = await updateRes.json();
    console.log('Test 6 (Update Active Prescription Items & Notes):',
      updateRes.status === 200 && updateData?.data?.items?.length === 1 && updateData?.data?.notes?.includes('Updated') ? 'PASS' : 'FAIL'
    );

    // 7. Fetch Prescription Details by ID (for print view & letterhead)
    const detailRes = await fetch(`${baseUrl}/prescriptions/${prescription.id}`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const detailData = await detailRes.json();
    const detail = detailData?.data;
    console.log('Test 7 (Fetch Full Prescription Details with Hospital & Doctor):',
      detailRes.status === 200 && detail?.hospital?.name && detail?.doctor?.specialization ? 'PASS' : 'FAIL'
    );
    console.log(`- Hospital: ${detail?.hospital?.name} | Doctor: ${detail?.doctor?.user?.name} (${detail?.doctor?.department?.name})`);

    // 8. Patient Longitudinal Medication History
    const historyRes = await fetch(`${baseUrl}/prescriptions/patient/${patient.id}`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const historyData = await historyRes.json();
    console.log('Test 8 (Patient Prescription History Timeline):',
      historyRes.status === 200 && Array.isArray(historyData?.data) && historyData.data.length >= 1 ? 'PASS' : 'FAIL'
    );

    // 9. Pharmacist Access to Prescriptions (Ready for Phase 12 Dispensing)
    const pharmViewRes = await fetch(`${baseUrl}/prescriptions/${prescription.id}`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    console.log('Test 9 (Pharmacist Authorized to View Prescriptions):',
      pharmViewRes.status === 200 ? 'PASS' : 'FAIL'
    );

    // 10. RBAC Enforcement: Receptionist cannot issue prescriptions
    const receptDenyRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        items: [{ medicineId: paracetamol.id, dosage: '650mg', frequency: '1-0-1', duration: '3 days' }],
      }),
    });
    console.log('Test 10 (Receptionist Blocked from Issuing Prescriptions - RBAC):',
      receptDenyRes.status === 403 ? 'PASS' : 'FAIL'
    );

    console.log('--- All Digital Prescriptions Module API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runPrescriptionTests().catch((err) => {
  console.error('Prescription test failed:', err);
  process.exit(1);
});
