import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Adyapan HMS Database Seeding...');

  // 1. Hospital Seed
  const hospital = await prisma.hospital.upsert({
    where: { code: 'ADY-MAIN' },
    update: {},
    create: {
      name: 'Adyapan Central Hospital & Clinic',
      code: 'ADY-MAIN',
      address: 'Plot 42, Health City, Medical Enclave',
      phone: '+91 80 2345 6789',
      email: 'admin@adyapan.com',
      isActive: true,
    },
  });
  console.log(`✓ Hospital configured: ${hospital.name} (${hospital.id})`);

  // Default hashed password for seed users
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

  // 2. Roles & Users Seed (All 7 Master Roles)
  const seedUsers = [
    {
      name: 'Super Administrator',
      email: 'superadmin@adyapan.com',
      role: 'SUPER_ADMIN',
      phone: '+91 9900000001',
    },
    {
      name: 'Hospital Administrator',
      email: 'admin@adyapan.com',
      role: 'HOSPITAL_ADMIN',
      phone: '+91 9900000002',
    },
    {
      name: 'Pooja Verma (Reception Desk)',
      email: 'reception@adyapan.com',
      role: 'RECEPTIONIST',
      phone: '+91 9900000003',
    },
    {
      name: 'Dr. Rajesh Sharma',
      email: 'doctor.sharma@adyapan.com',
      role: 'DOCTOR',
      phone: '+91 9900000004',
    },
    {
      name: 'Sunita Reddy (Nurse Assistant)',
      email: 'nurse@adyapan.com',
      role: 'NURSE_ASSISTANT',
      phone: '+91 9900000005',
    },
    {
      name: 'Manoj Kumar (Chief Pharmacist)',
      email: 'pharmacist@adyapan.com',
      role: 'PHARMACIST',
      phone: '+91 9900000006',
    },
    {
      name: 'Anita Desai (Chief Accountant)',
      email: 'accounts@adyapan.com',
      role: 'ACCOUNTANT',
      phone: '+91 9900000007',
    },
  ];

  const createdUsers = {};
  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where: {
        hospitalId_email: {
          hospitalId: hospital.id,
          email: u.email,
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: u.name,
        email: u.email,
        password: defaultPasswordHash,
        role: u.role,
        phone: u.phone,
        status: 'ACTIVE',
      },
    });
    createdUsers[u.role] = user;
    console.log(`✓ User seeded: ${u.role} -> ${u.email}`);
  }

  // 3. Departments Seed
  const departmentsData = [
    { name: 'General Medicine', code: 'GEN', description: 'Primary care, adult medicine and internal diagnostics' },
    { name: 'Cardiology', code: 'CARD', description: 'Heart and cardiovascular care' },
    { name: 'Pediatrics', code: 'PED', description: 'Child healthcare and immunizations' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Bone, joint and musculoskeletal care' },
    { name: 'Dental Care', code: 'DENT', description: 'Oral healthcare and treatments' },
    { name: 'Neurology & Brain Sciences', code: 'NEU', description: 'Advanced neurology, brain and nerve care' },
  ];

  const createdDepartments = {};
  for (const dept of departmentsData) {
    const department = await prisma.department.upsert({
      where: {
        hospitalId_code: {
          hospitalId: hospital.id,
          code: dept.code,
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        isActive: true,
      },
    });
    createdDepartments[dept.code] = department;
  }
  console.log(`✓ Seeded ${departmentsData.length} clinical departments`);

  // 4. Doctor Profiles & Schedules for Each Clinical Category
  const categoryDoctors = [
    {
      name: 'Dr. Rajesh Sharma',
      email: 'doctor.sharma@adyapan.com',
      phone: '+91 9900000004',
      deptCode: 'GEN',
      specialization: 'Senior Consultant Physician (MBBS, MD)',
      fee: 500,
    },
    {
      name: 'Dr. Priya Patel',
      email: 'doctor.cardio@adyapan.com',
      phone: '+91 9900000011',
      deptCode: 'CARD',
      specialization: 'Senior Cardiologist & Heart Specialist (DM, MD)',
      fee: 800,
    },
    {
      name: 'Dr. Vikram Rao',
      email: 'doctor.pediatric@adyapan.com',
      phone: '+91 9900000012',
      deptCode: 'PED',
      specialization: 'Chief Pediatrician & Child Health Specialist (MD, DCH)',
      fee: 600,
    },
    {
      name: 'Dr. Suresh Menon',
      email: 'doctor.ortho@adyapan.com',
      phone: '+91 9900000013',
      deptCode: 'ORTH',
      specialization: 'Senior Orthopedic Surgeon (MS Ortho)',
      fee: 750,
    },
    {
      name: 'Dr. Neha Kapoor',
      email: 'doctor.dental@adyapan.com',
      phone: '+91 9900000014',
      deptCode: 'DENT',
      specialization: 'Dental Surgeon & Orthodontist (BDS, MDS)',
      fee: 400,
    },
    {
      name: 'Dr. Arvind Joshi',
      email: 'doctor.neuro@adyapan.com',
      phone: '+91 9900000015',
      deptCode: 'NEU',
      specialization: 'Senior Neurologist & Stroke Specialist (MD, DM Neurology)',
      fee: 900,
    },
  ];

  for (const docInfo of categoryDoctors) {
    const dept = createdDepartments[docInfo.deptCode];
    if (!dept) continue;

    // Upsert User
    const docUser = await prisma.user.upsert({
      where: {
        hospitalId_email: {
          hospitalId: hospital.id,
          email: docInfo.email,
        },
      },
      update: {
        name: docInfo.name,
        role: 'DOCTOR',
        status: 'ACTIVE',
      },
      create: {
        hospitalId: hospital.id,
        name: docInfo.name,
        email: docInfo.email,
        password: defaultPasswordHash,
        role: 'DOCTOR',
        phone: docInfo.phone,
        status: 'ACTIVE',
      },
    });

    // Upsert Doctor Profile
    let docProfile = await prisma.doctor.findUnique({
      where: { userId: docUser.id },
    });

    if (!docProfile) {
      docProfile = await prisma.doctor.create({
        data: {
          hospitalId: hospital.id,
          userId: docUser.id,
          departmentId: dept.id,
          specialization: docInfo.specialization,
          consultationFee: docInfo.fee,
          status: 'AVAILABLE',
        },
      });
    } else {
      docProfile = await prisma.doctor.update({
        where: { id: docProfile.id },
        data: {
          departmentId: dept.id,
          specialization: docInfo.specialization,
          consultationFee: docInfo.fee,
          status: 'AVAILABLE',
        },
      });
    }

    // Configure 7-day schedules (Mon to Sun: 0 to 6)
    for (let day = 0; day <= 6; day++) {
      const existingSchedule = await prisma.doctorSchedule.findFirst({
        where: { doctorId: docProfile.id, dayOfWeek: day },
      });

      if (!existingSchedule) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: docProfile.id,
            dayOfWeek: day,
            startTime: '08:00',
            endTime: '20:00',
            slotDurationMinutes: 15,
            maxCapacity: 40,
            breakStartTime: '13:00',
            breakEndTime: '14:00',
            isActive: true,
          },
        });
      } else if (!existingSchedule.isActive) {
        await prisma.doctorSchedule.update({
          where: { id: existingSchedule.id },
          data: { isActive: true },
        });
      }
    }
    console.log(`✓ Doctor [${dept.name}] configured: ${docInfo.name} -> ${docInfo.email}`);
  }

  // 5. Medicine Categories & Medicine Catalog
  const categories = [
    { name: 'Antibiotics', description: 'Antimicrobial medication' },
    { name: 'Analgesics & Antipyretics', description: 'Pain relief and fever reducers' },
    { name: 'Gastrointestinal', description: 'Digestive and antacid drugs' },
  ];

  for (const cat of categories) {
    const category = await prisma.medicineCategory.upsert({
      where: {
        hospitalId_name: {
          hospitalId: hospital.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: cat.name,
        description: cat.description,
      },
    });

    if (cat.name === 'Analgesics & Antipyretics') {
      const paracetamol = await prisma.medicine.upsert({
        where: {
          hospitalId_name: {
            hospitalId: hospital.id,
            name: 'Paracetamol 650mg',
          },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          categoryId: category.id,
          name: 'Paracetamol 650mg',
          genericName: 'Acetaminophen',
          manufacturer: 'GSK Pharma',
          unit: 'TABLETS',
          minStockAlert: 100,
        },
      });

      // Add Batch
      await prisma.medicineBatch.upsert({
        where: {
          medicineId_batchNumber: {
            medicineId: paracetamol.id,
            batchNumber: 'PCM-2026-B1',
          },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          medicineId: paracetamol.id,
          batchNumber: 'PCM-2026-B1',
          expiryDate: new Date('2028-06-30'),
          quantity: 500,
          purchasePrice: 1.2,
          sellingPrice: 2.5,
        },
      });
    }

    if (cat.name === 'Antibiotics') {
      const amox = await prisma.medicine.upsert({
        where: {
          hospitalId_name: {
            hospitalId: hospital.id,
            name: 'Amoxicillin 500mg',
          },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          categoryId: category.id,
          name: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin Trihydrate',
          manufacturer: 'Cipla Health',
          unit: 'CAPSULES',
          minStockAlert: 50,
        },
      });

      await prisma.medicineBatch.upsert({
        where: {
          medicineId_batchNumber: {
            medicineId: amox.id,
            batchNumber: 'AMX-2026-X4',
          },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          medicineId: amox.id,
          batchNumber: 'AMX-2026-X4',
          expiryDate: new Date('2027-12-31'),
          quantity: 200,
          purchasePrice: 6.0,
          sellingPrice: 10.0,
        },
      });
    }
  }
  console.log(`✓ Seeded Pharmacy Medicine categories and stock batches`);

  // 6. Test Patients
  const testPatients = [
    {
      uhid: 'ADY-202609-0001',
      fullName: 'John Doe',
      phone: '+91 9876543210',
      email: 'john.doe@example.com',
      gender: 'MALE',
      bloodGroup: 'O+',
      dateOfBirth: new Date('1985-05-15'),
      address: 'Flat 101, Palm Meadows, Bangalore',
      emergencyContact: 'Jane Doe (+91 9876543219)',
      medicalHistory: 'Mild Hypertension diagnosed in 2022',
    },
    {
      uhid: 'ADY-202609-0002',
      fullName: 'Priya Patel',
      phone: '+91 9876543211',
      email: 'priya.patel@example.com',
      gender: 'FEMALE',
      bloodGroup: 'B+',
      dateOfBirth: new Date('1992-10-22'),
      address: '22 Maple Street, Bangalore',
      emergencyContact: 'Amit Patel (+91 9876543218)',
      medicalHistory: 'No known drug allergies',
    },
  ];

  for (const p of testPatients) {
    await prisma.patient.upsert({
      where: {
        hospitalId_uhid: {
          hospitalId: hospital.id,
          uhid: p.uhid,
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        uhid: p.uhid,
        fullName: p.fullName,
        phone: p.phone,
        email: p.email,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        dateOfBirth: p.dateOfBirth,
        address: p.address,
        emergencyContact: p.emergencyContact,
        medicalHistory: p.medicalHistory,
      },
    });
  }
  console.log(`✓ Seeded ${testPatients.length} sample patients with valid UHIDs`);

  console.log('===================================================');
  console.log(' Adyapan HMS Database Foundation Seed Completed!   ');
  console.log('===================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
