/**
 * Generates a unique hospital invoice number
 * Format: INV-YYYYMM-XXXX (e.g. INV-202609-0001)
 */
export const generateInvoiceNumber = async (prisma, hospitalId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}-`;

  // Count existing invoices created in this hospital with this month's prefix
  const count = await prisma.invoice.count({
    where: {
      hospitalId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
  });

  let counter = count + 1;
  let candidateNumber = `${prefix}${String(counter).padStart(4, '0')}`;

  // Collision guard
  let collision = await prisma.invoice.findFirst({
    where: { hospitalId, invoiceNumber: candidateNumber },
  });

  while (collision) {
    counter++;
    candidateNumber = `${prefix}${String(counter).padStart(4, '0')}`;
    collision = await prisma.invoice.findFirst({
      where: { hospitalId, invoiceNumber: candidateNumber },
    });
  }

  return candidateNumber;
};
