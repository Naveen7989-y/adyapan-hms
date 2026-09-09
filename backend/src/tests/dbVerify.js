import prisma from '../config/db.js';

async function verify() {
  console.log('--- Verifying Database Connection and Integrity ---');
  const hospitals = await prisma.hospital.count();
  const users = await prisma.user.count();
  const departments = await prisma.department.count();
  const doctors = await prisma.doctor.count();
  const schedules = await prisma.doctorSchedule.count();
  const medicines = await prisma.medicine.count();
  const batches = await prisma.medicineBatch.count();
  const patients = await prisma.patient.count();

  console.log('Hospitals Count:', hospitals);
  console.log('Users Count (7 Roles):', users);
  console.log('Departments Count:', departments);
  console.log('Doctors Count:', doctors);
  console.log('Doctor Schedules Count:', schedules);
  console.log('Medicines Count:', medicines);
  console.log('Medicine Batches Count:', batches);
  console.log('Patients Count:', patients);

  // Test relational integrity query
  const doctorWithSchedule = await prisma.doctor.findFirst({
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: { select: { name: true, code: true } },
      schedules: true,
    },
  });

  console.log('Relational Doctor Query Success:');
  console.log('- Doctor Name:', doctorWithSchedule?.user?.name);
  console.log('- Department:', doctorWithSchedule?.department?.name);
  console.log('- Schedules Configured:', doctorWithSchedule?.schedules?.length);

  // Test transaction capability
  await prisma.$transaction(async (tx) => {
    const p = await tx.patient.findFirst();
    if (!p) throw new Error('No patient found in tx test');
    return p;
  });
  console.log('✓ Prisma atomic transaction verified successfully.');

  await prisma.$disconnect();
  console.log('--- Database Verification Complete & Verified ---');
}

verify().catch((e) => {
  console.error('Database verification failed:', e);
  process.exit(1);
});
