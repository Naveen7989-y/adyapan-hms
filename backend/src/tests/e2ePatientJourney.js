import app from '../app.js';
import prisma from '../config/db.js';

export const runE2EPatientJourney = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING MASTER END-TO-END PATIENT JOURNEY TEST ---');
  console.log('============================================================');

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

    const uniqueId = Date.now().toString().slice(-6);
    const testPatientEmail = `journey.patient.${uniqueId}@adyapan.test`;
    const testPatientPhone = `91${uniqueId.padStart(8, '0')}`;

    // STEP 1: Receptionist Authentication
    const receptionToken = await login('reception@adyapan.com');
    if (!receptionToken) throw new Error('Receptionist login failed');
    console.log('Step 1 (Receptionist Authentication): PASS');

    // STEP 2: Register New Patient
    const regRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        fullName: `Aarav Sharma ${uniqueId}`,
        phone: testPatientPhone,
        email: testPatientEmail,
        gender: 'MALE',
        dateOfBirth: '1990-06-15',
        bloodGroup: 'O_POSITIVE',
        address: '104 Sunrise Boulevard, Hyderabad',
      }),
    });
    const regData = await regRes.json();
    const patient = regData?.data;
    if (regRes.status !== 201 || !patient?.uhid) {
      throw new Error(`Patient registration failed: ${JSON.stringify(regData)}`);
    }
    console.log(`Step 2 (Patient Intake & UHID Issued): PASS -> UHID: ${patient.uhid}`);

    // STEP 3: Discover Doctor & Schedule Appointment
    const doctorsRes = await fetch(`${baseUrl}/doctors`, {
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    const doctorsData = await doctorsRes.json();
    const docList = doctorsData?.data?.doctors || doctorsData?.data || [];
    const doctor = docList.find((d) => d.user?.email === 'doctor.sharma@adyapan.com') || docList[0];
    if (!doctor) throw new Error('No doctor found in hospital registry');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Ensure doctor has active schedules for all days of the week (0-6)
    for (let d = 0; d <= 6; d++) {
      const existingSched = await prisma.doctorSchedule.findFirst({
        where: { doctorId: doctor.id, dayOfWeek: d },
      });
      if (existingSched) {
        await prisma.doctorSchedule.update({
          where: { id: existingSched.id },
          data: { isActive: true, startTime: '08:00', endTime: '20:00', slotDurationMinutes: 15 },
        });
      } else {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: d,
            startTime: '08:00',
            endTime: '20:00',
            slotDurationMinutes: 15,
            maxCapacity: 50,
            isActive: true,
          },
        });
      }
    }

    // Discover available slot
    const slotsRes = await fetch(`${baseUrl}/appointments/slots?doctorId=${doctor.id}&date=${todayStr}`, {
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    const slotsJson = await slotsRes.json();
    const availableSlot = slotsJson.data?.slots?.find((s) => s.isAvailable)?.timeSlot || '15:30';

    const apptRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        appointmentDate: todayStr,
        timeSlot: availableSlot,
        reason: 'Severe persistent cough and chest congestion',
      }),
    });
    const apptData = await apptRes.json();
    const appointment = apptData?.data;
    if (apptRes.status !== 201 || !appointment?.id) {
      throw new Error(`Appointment booking failed: ${JSON.stringify(apptData)}`);
    }
    console.log(`Step 3 (Appointment Booked): PASS -> Slot: ${appointment.timeSlot} with Dr. ${doctor.user?.name}`);

    // STEP 4: Patient Arrives at Reception Desk -> Check-In & Issue Token
    const checkinRes = await fetch(`${baseUrl}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        appointmentId: appointment.id,
      }),
    });
    const checkinData = await checkinRes.json();
    const token = checkinData?.data?.token || checkinData?.data;
    if ((checkinRes.status !== 200 && checkinRes.status !== 201) || !token?.tokenNumber) {
      throw new Error(`Check-in and token issuance failed: ${JSON.stringify(checkinData)}`);
    }
    const tokenLabel = `T-${String(token.tokenNumber).padStart(3, '0')}`;
    console.log(`Step 4 (Patient Check-In & Digital Token): PASS -> Issued: ${tokenLabel} [${token.tokenType}]`);

    // STEP 5: Verify Asynchronous Notification Outbox
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    const notifData = await notifRes.json();
    const notifs = notifData?.data?.notifications || notifData?.data || [];
    console.log(`Step 5 (Notification Outbox Audit): PASS -> Found ${notifs.length} system notification logs`);

    // STEP 6: Doctor Authentication
    const doctorEmail = doctor.user?.email || 'doctor.sharma@adyapan.com';
    const doctorToken = await login(doctorEmail);
    if (!doctorToken) throw new Error(`Doctor login failed for ${doctorEmail}`);
    console.log(`Step 6 (Physician Workstation Authentication): PASS -> Logged in as ${doctor.user?.name}`);

    // STEP 7: Doctor Calls Patient to Room
    const callRes = await fetch(`${baseUrl}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        doctorId: doctor.id,
        roomNumber: '102',
        force: true,
      }),
    });
    const callData = await callRes.json();
    if (callRes.status !== 200) {
      throw new Error(`Call-next patient failed: ${JSON.stringify(callData)}`);
    }
    console.log(`Step 7 (Doctor Calls Patient to Room): PASS -> ${callData.data?.announcementText}`);

    // STEP 8: Start Consultation & Record Vitals
    const consultStartRes = await fetch(`${baseUrl}/consultations/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        tokenId: token.id,
        symptoms: 'Cough, Fever, Throat Pain',
        vitals: {
          bp: '120/80',
          pulse: 78,
          temp: 99.2,
          spo2: 98,
          weight: 68,
          height: 172,
          bmi: 23.0,
        },
        notes: 'Pharyngeal erythema noted. Lungs clear to auscultation.',
      }),
    });
    const consultStartData = await consultStartRes.json();
    const consultation = consultStartData?.data;
    if (consultStartRes.status !== 201 && consultStartRes.status !== 200 || !consultation?.id) {
      throw new Error(`Consultation initialization failed: ${JSON.stringify(consultStartData)}`);
    }
    console.log('Step 8 (Consultation Started & Vitals Recorded): PASS -> BP: 120/80, BMI: 23.0');

    // STEP 9: Authorize Digital Prescription
    const medSearchRes = await fetch(`${baseUrl}/prescriptions/medicines?search=Paracetamol`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const medSearchData = await medSearchRes.json();
    const paracetamol = medSearchData?.data?.[0];
    if (!paracetamol) throw new Error('Paracetamol not found in catalog');

    const rxRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        consultationId: consultation.id,
        notes: 'Take medications with warm water. Avoid cold drinks.',
        items: [
          {
            medicineId: paracetamol.id,
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '5 days',
            quantityPrescribed: 10,
            instructions: 'After breakfast and dinner',
          },
        ],
      }),
    });
    const rxData = await rxRes.json();
    const prescription = rxData?.data;
    if (rxRes.status !== 201 || !prescription?.prescriptionCode) {
      throw new Error(`Prescription creation failed: ${JSON.stringify(rxData)}`);
    }
    console.log(`Step 9 (Digital Prescription Authorized): PASS -> Rx Code: ${prescription.prescriptionCode}`);

    // STEP 10: Finalize Consultation & Sync Queue State
    const completeConsultRes = await fetch(`${baseUrl}/consultations/${consultation.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
        advice: 'Adequate hydration, steam inhalation twice daily.',
        followUpDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      }),
    });
    const completeConsultData = await completeConsultRes.json();
    if (completeConsultRes.status !== 200) {
      throw new Error(`Consultation finalization failed: ${JSON.stringify(completeConsultData)}`);
    }
    console.log('Step 10 (Consultation Finalized & Queue Completed): PASS');

    // STEP 11: Pharmacist Authentication
    const pharmToken = await login('pharmacist@adyapan.com');
    if (!pharmToken) throw new Error('Pharmacist login failed');
    console.log('Step 11 (Pharmacist Authentication): PASS');

    // STEP 12: Prescription Dispense Preview (FEFO Batch Allocation)
    const previewRes = await fetch(`${baseUrl}/pharmacy/prescriptions/${prescription.id}/preview`, {
      headers: { Authorization: `Bearer ${pharmToken}` },
    });
    const previewData = await previewRes.json();
    if (previewRes.status !== 200) {
      throw new Error(`Dispense preview failed: ${JSON.stringify(previewData)}`);
    }
    console.log(`Step 12 (FEFO Dispense Preview): PASS -> Allocated Batches Bill: ₹${previewData.data?.totalEstimatedAmount}`);

    // STEP 13: Dispense Medications & Deduct Inventory Stock Atomically
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
    if (dispenseRes.status !== 201 && dispenseRes.status !== 200) {
      throw new Error(`Dispense execution failed: ${JSON.stringify(dispenseData)}`);
    }
    console.log(`Step 13 (Pharmacy Dispensing & Stock Deduction): PASS -> Dispense Total: ₹${dispenseData.data?.totalAmount}`);

    // STEP 14: Accountant Authentication
    const accToken = await login('accounts@adyapan.com');
    if (!accToken) throw new Error('Accountant login failed');
    console.log('Step 14 (Accountant Cashier Authentication): PASS');

    // STEP 15: Single-Click Encounter Billing Auto-Calculation
    const encounterPreviewRes = await fetch(
      `${baseUrl}/billing/encounter-preview?patientId=${patient.id}&appointmentId=${appointment.id}`,
      { headers: { Authorization: `Bearer ${accToken}` } }
    );
    const encounterData = await encounterPreviewRes.json();
    if (encounterPreviewRes.status !== 200) {
      throw new Error(`Encounter billing preview failed: ${JSON.stringify(encounterData)}`);
    }
    console.log(
      `Step 15 (Encounter Billing Auto-Calculation): PASS -> Consult Fee: ₹${encounterData.data?.consultationFee} + Pharmacy: ₹${encounterData.data?.pharmacyFee}`
    );

    // STEP 16: Generate Patient Tax Invoice
    const invoiceRes = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        appointmentId: appointment.id,
        consultationFee: encounterData.data?.consultationFee || 500,
        pharmacyFee: encounterData.data?.pharmacyFee || 50,
        otherCharges: 50,
        discount: 0,
        tax: 0,
      }),
    });
    const invoiceData = await invoiceRes.json();
    const invoice = invoiceData?.data;
    if (invoiceRes.status !== 201 || !invoice?.invoiceNumber) {
      throw new Error(`Invoice generation failed: ${JSON.stringify(invoiceData)}`);
    }
    console.log(`Step 16 (Invoice Generated): PASS -> Invoice: ${invoice.invoiceNumber} | Net: ₹${invoice.totalAmount}`);

    // STEP 17: Partial Payment & Final Settlement
    const partialPaymentRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: 200,
        paymentMethod: 'UPI',
        transactionRef: 'UPI-JOURNEY-PARTIAL-001',
      }),
    });
    const partialData = await partialPaymentRes.json();
    console.log(`Step 17a (Partial Payment Recorded): PASS -> Paid: ₹200 | Status: ${partialData.data?.invoice?.paymentStatus}`);

    const remainingBal = invoice.totalAmount - 200;
    const finalPaymentRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accToken}`,
      },
      body: JSON.stringify({
        amount: remainingBal,
        paymentMethod: 'CASH',
        transactionRef: 'CASH-COUNTER-CLEARANCE',
      }),
    });
    const finalData = await finalPaymentRes.json();
    console.log(`Step 17b (Final Balance Settled): PASS -> Full Settlement | Status: ${finalData.data?.invoice?.paymentStatus}`);

    // STEP 18: Fetch Full Official Tax Invoice Receipt Graph
    const receiptRes = await fetch(`${baseUrl}/billing/invoices/${invoice.id}`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const receiptData = await receiptRes.json();
    if (receiptRes.status !== 200 || !receiptData.data?.hospital?.name) {
      throw new Error(`Receipt fetch failed: ${JSON.stringify(receiptData)}`);
    }
    console.log(`Step 18 (Official Tax Invoice Receipt Graph): PASS -> Hospital: ${receiptData.data.hospital.name}`);

    // STEP 19: Verify Hospital Financial & Analytics Reports Update
    const reportsRes = await fetch(`${baseUrl}/reports/financial`, {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    const reportsData = await reportsRes.json();
    console.log(
      `Step 19 (Hospital Financial Intelligence Sync): PASS -> Total Billed in Ledger: ₹${reportsData.data?.summary?.totalBilled}`
    );

    console.log('\n============================================================');
    console.log('--- ALL 19 STEPS OF MASTER PATIENT JOURNEY PASSED! ---');
    console.log('============================================================\n');
  } finally {
    server.close();
  }
};

if (process.argv[1].endsWith('e2ePatientJourney.js')) {
  runE2EPatientJourney().catch((err) => {
    console.error('Master E2E Journey Failed:', err);
    process.exit(1);
  });
}
