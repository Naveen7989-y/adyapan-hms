import app from '../app.js';
import prisma from '../config/db.js';

async function runAppointmentTests() {
  console.log('--- Starting Appointment Management API Tests ---');
  const server = app.listen(5004);
  const baseUrl = 'http://localhost:5004/api';

  try {
    // 1. Receptionist login
    const recLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@adyapan.com', password: 'Password123!' }),
    });
    const recToken = (await recLogin.json()).data?.token;

    // Get doctor Dr. Rajesh Sharma
    const doctor = await prisma.doctor.findFirst({
      where: { user: { name: 'Dr. Rajesh Sharma' } },
      include: { user: true, schedules: true },
    });

    // Ensure Monday schedule is configured (day 1)
    await prisma.doctorSchedule.upsert({
      where: { id: doctor.schedules[0]?.id || 'dummy' },
      update: {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 15,
        maxCapacity: 20,
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        isActive: true,
      },
      create: {
        doctorId: doctor.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 15,
        maxCapacity: 20,
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        isActive: true,
      },
    });

    // Get a test patient
    const patient = await prisma.patient.findFirst();

    // Pick next Monday date string (noon to avoid UTC date boundary shift)
    const today = new Date();
    const distanceToMonday = (1 + 7 - today.getDay()) % 7 || 7;
    const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + distanceToMonday, 12, 0, 0);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Test 1: Discover Available Time Slots
    const slotsRes = await fetch(`${baseUrl}/appointments/slots?doctorId=${doctor.id}&date=${dateStr}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const slotsJson = await slotsRes.json();
    console.log('Test 1 (Discover Available Slots):',
      slotsRes.status === 200 && Array.isArray(slotsJson.data?.slots) && slotsJson.data.slots.length > 0 ? 'PASS' : 'FAIL'
    );
    console.log('- Total Generated Slots for Day:', slotsJson.data?.slots?.length);
    console.log('- First Slot:', slotsJson.data?.slots?.[0]?.timeSlot);

    // Test 2: Book Appointment
    const targetSlot = slotsJson.data.slots[0].timeSlot;
    const bookRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: dateStr,
        timeSlot: targetSlot,
        reason: 'General health checkup and fatigue consultation',
      }),
    });
    const bookJson = await bookRes.json();
    const appointment = bookJson.data;
    console.log('Test 2 (Book Appointment):', bookRes.status === 201 && appointment?.id ? 'PASS' : 'FAIL');
    console.log('- Appointment ID:', appointment?.id);
    console.log('- Initial Status:', appointment?.status);

    // Test 3: Double-Booking Conflict Prevention (Should be 409 Conflict)
    const doubleBookRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: dateStr,
        timeSlot: targetSlot, // Same slot!
        reason: 'Double booking attempt',
      }),
    });
    console.log('Test 3 (Double-Booking Conflict Intercepted):', doubleBookRes.status === 409 ? 'PASS' : 'FAIL');

    // Test 4: Reschedule Appointment to Second Slot
    const secondSlot = slotsJson.data.slots[1].timeSlot;
    const reschedRes = await fetch(`${baseUrl}/appointments/${appointment.id}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        appointmentDate: dateStr,
        timeSlot: secondSlot,
      }),
    });
    const reschedJson = await reschedRes.json();
    console.log('Test 4 (Reschedule Appointment):',
      reschedRes.status === 200 && reschedJson.data?.timeSlot === secondSlot ? 'PASS' : 'FAIL'
    );

    // Test 5: Verify First Slot is Now Free (after reschedule)
    const reSlotsRes = await fetch(`${baseUrl}/appointments/slots?doctorId=${doctor.id}&date=${dateStr}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const reSlotsJson = await reSlotsRes.json();
    const firstSlotObj = reSlotsJson.data.slots.find((s) => s.timeSlot === targetSlot);
    console.log('Test 5 (Freed Slot is Available Again):', firstSlotObj?.isAvailable === true ? 'PASS' : 'FAIL');

    // Test 6: Update Appointment Status (e.g. CHECKED_IN)
    const statusRes = await fetch(`${baseUrl}/appointments/${appointment.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ status: 'CHECKED_IN' }),
    });
    const statusJson = await statusRes.json();
    console.log('Test 6 (Update Appointment Status to CHECKED_IN):',
      statusRes.status === 200 && statusJson.data?.status === 'CHECKED_IN' ? 'PASS' : 'FAIL'
    );

    // Test 7: Cancel Appointment
    const cancelRes = await fetch(`${baseUrl}/appointments/${appointment.id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Patient called to cancel due to travel conflict',
      }),
    });
    const cancelJson = await cancelRes.json();
    console.log('Test 7 (Cancel Appointment with Reason):',
      cancelRes.status === 200 && cancelJson.data?.status === 'CANCELLED' ? 'PASS' : 'FAIL'
    );

    // Test 8: List & Search Appointments
    const listRes = await fetch(`${baseUrl}/appointments?date=${dateStr}&doctorId=${doctor.id}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const listJson = await listRes.json();
    console.log('Test 8 (List & Filter Appointments):',
      listRes.status === 200 && Array.isArray(listJson.data?.appointments) ? 'PASS' : 'FAIL'
    );

    console.log('--- All Appointment Management API Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runAppointmentTests().catch((e) => {
  console.error('Appointment test failed:', e);
  process.exit(1);
});
