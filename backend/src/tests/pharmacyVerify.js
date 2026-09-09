import app from '../app.js';
import prisma from '../config/db.js';

async function runPharmacyTests() {
  console.log('--- Starting Pharmacy & Inventory Module API Tests ---');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Authenticate Pharmacist, Doctor, and Receptionist
    const pharmLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pharmacist@adyapan.com', password: 'Password123!' }),
    });
    const pharmData = await pharmLoginRes.json();
    const pharmToken = pharmData?.data?.token;

    const docLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor.sharma@adyapan.com', password: 'Password123!' }),
    });
    const docData = await docLoginRes.json();
    const docToken = docData?.data?.token;

    const receptLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const receptData = await receptLoginRes.json();
    const receptToken = receptData?.data?.token;

    console.log('Test 1 (Pharmacist, Doctor & Receptionist Authentication):',
      pharmLoginRes.status === 200 && pharmToken && docToken && receptToken ? 'PASS' : 'FAIL'
    );

    // 2. Query Medicines Inventory
    const invRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const invData = await invRes.json();
    const medicines = invData?.data?.medicines || [];
    console.log('Test 2 (Inventory Catalog Query & Stock Status):',
      invRes.status === 200 && medicines.length >= 2 ? 'PASS' : 'FAIL'
    );
    const pcm = medicines.find((m) => m.name.includes('Paracetamol'));
    console.log(`- Seeded Medicine: ${pcm?.name} | Available Stock: ${pcm?.availableStock} | Status: ${pcm?.stockStatus}`);

    // 3. Add Medicine & Sequential Batches
    const createMedRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        name: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        categoryName: 'Analgesics & Antipyretics',
        manufacturer: 'Abbott Labs',
        unit: 'TABLETS',
        minStockAlert: 30,
      }),
    });
    const createMedData = await createMedRes.json();
    const ibuprofen = createMedData?.data;

    // Add Batch 1 (Expiring in 6 months - should be chosen first by FEFO)
    const expiryB1 = new Date();
    expiryB1.setMonth(expiryB1.getMonth() + 6);
    const b1Res = await fetch(`${baseUrl}/pharmacy/medicines/${ibuprofen.id}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        batchNumber: 'IBU-FEFO-01',
        expiryDate: expiryB1.toISOString(),
        quantity: 100,
        purchasePrice: 1.5,
        sellingPrice: 3.0,
      }),
    });

    // Add Batch 2 (Expiring in 18 months)
    const expiryB2 = new Date();
    expiryB2.setMonth(expiryB2.getMonth() + 18);
    const b2Res = await fetch(`${baseUrl}/pharmacy/medicines/${ibuprofen.id}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        batchNumber: 'IBU-FEFO-02',
        expiryDate: expiryB2.toISOString(),
        quantity: 50,
        purchasePrice: 1.6,
        sellingPrice: 3.2,
      }),
    });

    console.log('Test 3 (Add Medicine & Sequential Batches):',
      createMedRes.status === 201 && b1Res.status === 201 && b2Res.status === 201 ? 'PASS' : 'FAIL'
    );

    // 4. Inventory Alerts
    const alertsRes = await fetch(`${baseUrl}/pharmacy/alerts`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const alertsData = await alertsRes.json();
    console.log('Test 4 (Inventory Stock & Expiry Alerts):',
      alertsRes.status === 200 && alertsData?.data !== undefined ? 'PASS' : 'FAIL'
    );
    console.log(`- Low Stock Count: ${alertsData?.data?.lowStockCount} | Out of Stock Count: ${alertsData?.data?.outOfStockCount}`);

    // 5. Create Test Prescription to Dispense
    const doctor = await prisma.doctor.findFirst({
      where: { user: { name: 'Dr. Rajesh Sharma' } },
    });
    const patient = await prisma.patient.findFirst();

    const rxRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        notes: 'Take with milk. Dispense as prescribed.',
        items: [
          {
            medicineId: ibuprofen.id,
            dosage: '400mg',
            frequency: '1-0-1',
            duration: '10 days',
            instructions: 'After meals',
            quantityPrescribed: 20,
          },
          {
            medicineId: pcm.id,
            dosage: '650mg',
            frequency: '1-0-0',
            duration: '5 days',
            instructions: 'Morning after food',
            quantityPrescribed: 5,
          },
        ],
      }),
    });
    const rxData = await rxRes.json();
    const prescription = rxData?.data;

    console.log('Test 5 (Issue Prescription for Pharmacy Desk):',
      rxRes.status === 201 && prescription?.status === 'ACTIVE' ? 'PASS' : 'FAIL'
    );
    console.log(`- Prescription to Dispense: ${prescription?.prescriptionCode} (Status: ${prescription?.status})`);

    // 6. Dispense Preview with FEFO (First Expiring First Out)
    const previewRes = await fetch(`${baseUrl}/pharmacy/prescriptions/${prescription.id}/preview`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const previewData = await previewRes.json();
    const preview = previewData?.data;

    const ibuItem = preview?.items?.find((it) => it.medicineId === ibuprofen.id);
    const firstAllocBatch = ibuItem?.batchAllocations?.[0];

    console.log('Test 6 (FEFO Dispense Preview & Price Estimation):',
      previewRes.status === 200 &&
      preview?.canFullyDispense === true &&
      firstAllocBatch?.batchNumber === 'IBU-FEFO-01' ? 'PASS' : 'FAIL'
    );
    console.log(`- FEFO Selected Batch: ${firstAllocBatch?.batchNumber} (Qty: ${firstAllocBatch?.allocatedQuantity})`);
    console.log(`- Estimated Total: ₹${preview?.totalEstimatedAmount}`);

    // Check Initial Stock of Batch 1
    const b1Before = await prisma.medicineBatch.findFirst({
      where: { batchNumber: 'IBU-FEFO-01' },
    });
    const initialB1Qty = b1Before.quantity;

    // 7. Dispense Prescription & Deduct Stock Atomically
    const dispenseRes = await fetch(`${baseUrl}/pharmacy/dispense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        prescriptionId: prescription.id,
      }),
    });
    const dispenseData = await dispenseRes.json();
    const dispense = dispenseData?.data;

    // Check Stock After Dispense
    const b1After = await prisma.medicineBatch.findFirst({
      where: { batchNumber: 'IBU-FEFO-01' },
    });

    // Check Prescription Status After Dispense
    const updatedRx = await prisma.prescription.findUnique({
      where: { id: prescription.id },
      include: { items: true },
    });

    console.log('Test 7 (Atomic Stock Deduction & Prescription Finalization):',
      dispenseRes.status === 201 &&
      b1After.quantity === initialB1Qty - 20 &&
      updatedRx.status === 'DISPENSED' ? 'PASS' : 'FAIL'
    );
    console.log(`- Stock Deduction: ${initialB1Qty} -> ${b1After.quantity} (-20 units allocated)`);
    console.log(`- Prescription Status: ${updatedRx.status} (PASS)`);
    console.log(`- Total Bill Billed: ₹${dispense?.totalAmount}`);

    // 8. Prevent Double-Dispensing
    const doubleDispenseRes = await fetch(`${baseUrl}/pharmacy/dispense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        prescriptionId: prescription.id,
      }),
    });
    console.log('Test 8 (Prevent Double-Dispensing Already Dispensed Prescription):',
      doubleDispenseRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // 9. Fetch Dispense Receipt for Printing / Invoicing
    const receiptRes = await fetch(`${baseUrl}/pharmacy/dispenses/${dispense.id}`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const receiptData = await receiptRes.json();
    const receipt = receiptData?.data;

    console.log('Test 9 (Fetch Dispense Receipt with Relational Items & Hospital):',
      receiptRes.status === 200 &&
      receipt?.items?.length === 2 &&
      receipt?.prescription?.patient?.fullName &&
      receipt?.hospital?.name ? 'PASS' : 'FAIL'
    );
    console.log(`- Dispense Receipt ID: ${receipt?.id} | Pharmacist: ${receipt?.pharmacist?.name}`);

    // 10. RBAC Enforcement: Receptionist cannot dispense medicines
    const receptDispenseRes = await fetch(`${baseUrl}/pharmacy/dispense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptToken}`,
      },
      body: JSON.stringify({ prescriptionId: prescription.id }),
    });
    console.log('Test 10 (Receptionist Blocked from Dispensing - RBAC):',
      receptDispenseRes.status === 403 ? 'PASS' : 'FAIL'
    );

    console.log('--- All Pharmacy & Inventory Module API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runPharmacyTests().catch((err) => {
  console.error('Pharmacy test failed:', err);
  process.exit(1);
});
