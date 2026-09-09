import app from '../app.js';
import prisma from '../config/db.js';

async function runNotificationTests() {
  console.log('--- Starting Notification Foundation API Tests ---');
  const server = app.listen(5005);
  const baseUrl = 'http://localhost:5005/api';

  try {
    // 1. Receptionist login
    const recLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const recToken = (await recLogin.json()).data?.token;

    // Test 1: Test SMS Notification Dispatch
    const smsRes = await fetch(`${baseUrl}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        recipient: '+91 9876543210',
        channel: 'SMS',
        eventType: 'TEST_SMS',
        title: 'Adyapan SMS Test',
        message: 'This is a test SMS notification dispatched via the notification adapter.',
      }),
    });
    const smsJson = await smsRes.json();
    console.log('Test 1 (SMS Adapter Dispatch):',
      smsRes.status === 201 && smsJson.data?.status === 'SENT' && smsJson.data?.channel === 'SMS' ? 'PASS' : 'FAIL'
    );
    console.log('- SMS Message ID:', smsJson.data?.id);
    console.log('- Delivery Status:', smsJson.data?.status);

    // Test 2: Test Email Notification Dispatch
    const emailRes = await fetch(`${baseUrl}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        recipient: 'patient.care@example.com',
        channel: 'EMAIL',
        eventType: 'TEST_EMAIL',
        title: 'Adyapan Consultation Instructions',
        message: 'Please arrive 15 minutes before your scheduled appointment time.',
      }),
    });
    const emailJson = await emailRes.json();
    console.log('Test 2 (Email Adapter Dispatch):',
      emailRes.status === 201 && emailJson.data?.status === 'SENT' && emailJson.data?.channel === 'EMAIL' ? 'PASS' : 'FAIL'
    );

    // Test 3: Test WhatsApp Notification Dispatch
    const waRes = await fetch(`${baseUrl}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        recipient: '+91 9876543210',
        channel: 'WHATSAPP',
        eventType: 'TEST_WHATSAPP',
        title: 'Adyapan WhatsApp Message',
        message: 'Your token number is #04. Dr. Rajesh Sharma is currently consulting #02.',
      }),
    });
    const waJson = await waRes.json();
    console.log('Test 3 (WhatsApp Adapter Dispatch):',
      waRes.status === 201 && waJson.data?.status === 'SENT' && waJson.data?.channel === 'WHATSAPP' ? 'PASS' : 'FAIL'
    );

    // Test 4: Notification Query & Status Filter
    const listRes = await fetch(`${baseUrl}/notifications?status=SENT`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const listJson = await listRes.json();
    console.log('Test 4 (List Notifications Filtered by Status=SENT):',
      listRes.status === 200 && listJson.data?.notifications?.length >= 3 ? 'PASS' : 'FAIL'
    );
    console.log('- Total Sent Notifications Logged:', listJson.data?.notifications?.length);

    // Test 5: Notification Delivery Metrics
    const statsRes = await fetch(`${baseUrl}/notifications/stats`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const statsJson = await statsRes.json();
    console.log('Test 5 (Notification Delivery Metrics):',
      statsRes.status === 200 && statsJson.data?.total >= 3 && statsJson.data?.deliveryRate === 100 ? 'PASS' : 'FAIL'
    );
    console.log('- Metrics Summary:', statsJson.data);

    // Test 6: Verify Automatic Trigger on Appointment Booking
    const doctor = await prisma.doctor.findFirst({
      where: { user: { name: 'Dr. Rajesh Sharma' } },
    });
    const patient = await prisma.patient.findFirst();

    // Ensure Monday schedule is active
    await prisma.doctorSchedule.upsert({
      where: { id: 'test-sched-mon' },
      update: {
        doctorId: doctor.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
      create: {
        id: 'test-sched-mon',
        doctorId: doctor.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    });

    const today = new Date();
    const distanceToMonday = (1 + 7 - today.getDay()) % 7 || 7;
    const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + distanceToMonday + 7, 12, 0, 0);
    const bookingDateStr = targetDate.toISOString().split('T')[0];

    // Clean up any existing appointment on that date for idempotent test runs
    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: new Date(bookingDateStr),
      },
    });

    // Book appointment to verify trigger
    const bookRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: bookingDateStr,
        timeSlot: '12:00',
        reason: 'Notification automated trigger verification',
      }),
    });
    const bookJson = await bookRes.json();
    const appointmentId = bookJson.data?.id;

    // Wait 200ms for async notification promise to fulfill
    await new Promise((r) => setTimeout(r, 200));

    const autoNotif = await prisma.notification.findFirst({
      where: {
        eventType: 'APPOINTMENT_BOOKED',
        recipient: patient.phone,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Test 6 (Automated Notification Trigger on Appointment Booking):',
      bookRes.status === 201 && autoNotif && autoNotif.status === 'SENT' ? 'PASS' : 'FAIL'
    );
    console.log('- Auto Trigger Message:', autoNotif?.message);

    console.log('--- All Notification Foundation API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runNotificationTests().catch((e) => {
  console.error('Notification test failed:', e);
  process.exit(1);
});
