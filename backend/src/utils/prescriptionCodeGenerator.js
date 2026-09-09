/**
 * Generates a unique hospital prescription code
 * Format: RX-YYYYMM-XXXX (e.g. RX-202609-0001)
 */
export const generatePrescriptionCode = async (prisma, hospitalId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `RX-${year}${month}-`;

  // Count existing prescriptions created in this hospital with this month's prefix
  const count = await prisma.prescription.count({
    where: {
      hospitalId,
      prescriptionCode: {
        startsWith: prefix,
      },
    },
  });

  let counter = count + 1;
  let candidateCode = `${prefix}${String(counter).padStart(4, '0')}`;

  // Collision guard
  let collision = await prisma.prescription.findFirst({
    where: { hospitalId, prescriptionCode: candidateCode },
  });

  while (collision) {
    counter++;
    candidateCode = `${prefix}${String(counter).padStart(4, '0')}`;
    collision = await prisma.prescription.findFirst({
      where: { hospitalId, prescriptionCode: candidateCode },
    });
  }

  return candidateCode;
};
