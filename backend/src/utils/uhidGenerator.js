/**
 * Generates a unique hospital patient identifier (UHID)
 * Format: ADY-YYYYMM-XXXX (e.g. ADY-202609-0003)
 */
export const generateUHID = async (prisma, hospitalId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `ADY-${year}${month}-`;

  // Count existing patients created in this hospital with this month's prefix
  const count = await prisma.patient.count({
    where: {
      hospitalId,
      uhid: {
        startsWith: prefix,
      },
    },
  });

  const sequentialNumber = String(count + 1).padStart(4, '0');
  let candidateUhid = `${prefix}${sequentialNumber}`;

  // Check collision just in case
  let collision = await prisma.patient.findFirst({
    where: { hospitalId, uhid: candidateUhid },
  });

  let counter = count + 1;
  while (collision) {
    counter++;
    candidateUhid = `${prefix}${String(counter).padStart(4, '0')}`;
    collision = await prisma.patient.findFirst({
      where: { hospitalId, uhid: candidateUhid },
    });
  }

  return candidateUhid;
};
