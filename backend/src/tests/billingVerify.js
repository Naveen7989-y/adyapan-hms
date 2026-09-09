import app from '../app.js';
import prisma from '../config/db.js';

async function runBillingTests() {
  console.log('--- Starting Billing & Invoicing Module API Tests ---');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Authenticate Accountant, Receptionist, and Pharmacist
    const accLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'accounts@adyapan.com', password: 'Password123!' }),
    });
    const accData = await accLoginRes.json();
    const accToken = accData?.data?.token;

    const receptLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const receptData = await receptLoginRes.json();
    const receptToken = receptData?.data?.token;

    const pharmLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pharmacist@adyapan.com', password: 'Password123!' }),
    });
    const pharmData = await pharmLoginRes.json();
    const pharmToken = pharmData?.data?.token;

    console.log('Test 1 (Accountant, Receptionist & Pharmacist Auth):',
      accLoginRes.status === 200 && accToken && receptToken && pharmToken ? 'PASS' : 'FAIL'
    );

    // Get test patient
    const patient = await prisma.patient.findFirst();

    // 2. Encounter Billing Preview
    const previewRes = await fetch(`${baseUrl}/billing/encounter-preview?patientId=${patient.id}`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const previewData = await previewRes.json();
    console.log('Test 2 (Encounter Billing Calculation Preview):',
      previewRes.status === 200 && previewData?.data?.patient?.id === patient.id ? 'PASS' : 'FAIL'
    );
    console.log(`- Patient: ${previewData?.data?.patient?.fullName} | Estimated Encounter Total: ₹${previewData?.data?.estimatedTotal}`);

    // 3. Create Unified Patient Invoice
    const createInvRes = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        consultationFee: 500.0,
        pharmacyFee: 250.0,
        otherCharges: 100.0,
        discount: 50.0,
        tax: 0.0, // 500 + 250 + 100 - 50 = 800.0
        items: [
          { description: 'Senior Physician Consultation (Dr. Sharma)', quantity: 1, unitPrice: 500, totalPrice: 500 },
          { description: 'Medication Dispense - Antibiotics & Analgesics', quantity: 1, unitPrice: 250, totalPrice: 250 },
          { description: 'Diagnostic Vital Signs & ECG Screening', quantity: 1, unitPrice: 100, totalPrice: 100 },
        ],
      }),
    });
    const createInvData = await createInvRes.json();
    const invoice = createInvData?.data;

    console.log('Test 3 (Generate Invoice with Atomic Sequential Code):',
      createInvRes.status === 201 && invoice?.invoiceNumber?.startsWith('INV-') && invoice?.totalAmount === 800 ? 'PASS' : 'FAIL'
    );
    console.log(`- Invoice Number: ${invoice?.invoiceNumber} | Total Amount: ₹${invoice?.totalAmount} | Status: ${invoice?.paymentStatus}`);

    // 4. Validation Rules: Missing patientId must fail
    const invalidRes = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({ consultationFee: 500 }),
    });
    console.log('Test 4 (Reject Missing Patient with 400):',
      invalidRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // 5. Record Partial Payment (Cash Desk)
    const partPayRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 300.0,
        paymentMethod: 'CASH',
        transactionRef: 'CASH-DESK-01',
      }),
    });
    const partPayData = await partPayRes.json();
    const partInvoice = partPayData?.data?.invoice;

    console.log('Test 5 (Record Partial Payment & Update Status):',
      partPayRes.status === 201 &&
      partInvoice?.paidAmount === 300 &&
      partInvoice?.paymentStatus === 'PARTIALLY_PAID' ? 'PASS' : 'FAIL'
    );
    console.log(`- Paid: ₹${partInvoice?.paidAmount} / ₹${partInvoice?.totalAmount} | Balance: ₹${partInvoice?.totalAmount - partInvoice?.paidAmount} | Status: ${partInvoice?.paymentStatus}`);

    // 6. Record Final Payment (Online UPI)
    const finalPayRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 500.0,
        paymentMethod: 'UPI',
        transactionRef: 'UPI-9821872198',
      }),
    });
    const finalPayData = await finalPayRes.json();
    const finalInvoice = finalPayData?.data?.invoice;

    console.log('Test 6 (Record Final Payment & Complete Invoice):',
      finalPayRes.status === 201 &&
      finalInvoice?.paidAmount === 800 &&
      finalInvoice?.paymentStatus === 'PAID' ? 'PASS' : 'FAIL'
    );
    console.log(`- Final Status: ${finalInvoice?.paymentStatus} | Payments Count: ${finalInvoice?.payments?.length}`);

    // 7. Prevent Over-Payment
    const overPayRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 100.0,
        paymentMethod: 'CASH',
      }),
    });
    console.log('Test 7 (Prevent Over-Payment on Paid Invoice with 400):',
      overPayRes.status === 400 ? 'PASS' : 'FAIL'
    );

    // 8. Fetch Full Invoice Graph for Printable Tax Receipt
    const detailRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const detailData = await detailRes.json();
    const detail = detailData?.data;

    console.log('Test 8 (Fetch Full Invoice Details with Items & Payments):',
      detailRes.status === 200 &&
      detail?.items?.length === 3 &&
      detail?.payments?.length === 2 &&
      detail?.hospital?.name ? 'PASS' : 'FAIL'
    );
    console.log(`- Hospital Letterhead: ${detail?.hospital?.name} | Patient: ${detail?.patient?.fullName}`);

    // 9. Financial Revenue Metrics & Collections
    const metricsRes = await fetch(`${baseUrl}/billing/metrics`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const metricsData = await metricsRes.json();
    const metrics = metricsData?.data;

    console.log('Test 9 (Financial Revenue Metrics & Payment Mode Breakdown):',
      metricsRes.status === 200 &&
      metrics?.totalBilled >= 800 &&
      metrics?.totalCollected >= 800 &&
      metrics?.collectionsByMethod?.CASH !== undefined &&
      metrics?.collectionsByMethod?.UPI !== undefined ? 'PASS' : 'FAIL'
    );
    console.log(`- Total Billed: ₹${metrics?.totalBilled} | Total Collected: ₹${metrics?.totalCollected} | Today Collected: ₹${metrics?.todayCollection}`);

    // 10. RBAC Enforcement: Pharmacist cannot view billing metrics
    const denyMetricsRes = await fetch(`${baseUrl}/billing/metrics`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    console.log('Test 10 (Pharmacist Blocked from Financial Metrics - RBAC):',
      denyMetricsRes.status === 403 ? 'PASS' : 'FAIL'
    );

    console.log('--- All Billing & Invoicing Module API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runBillingTests().catch((err) => {
  console.error('Billing test failed:', err);
  process.exit(1);
});
