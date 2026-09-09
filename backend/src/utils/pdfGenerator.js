import PDFDocument from 'pdfkit';

/**
 * Generate a clinical prescription PDF stream using PDFKit
 * @param {Object} prescription - Complete relational prescription object
 * @param {import('express').Response} res - Express response stream
 */
export function generatePrescriptionPdf(prescription, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Prescription_${prescription.prescriptionCode || 'Rx'}.pdf"`
  );

  doc.pipe(res);

  const hospital = prescription.hospital || {};
  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const doctorUser = doctor.user || {};
  const dept = doctor.department || {};
  const consultation = prescription.consultation || {};

  // 1. Hospital Header
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#0284c7')
    .text(hospital.name || 'Adyapan Central Hospital & Clinic', { align: 'center' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(hospital.address || 'Medical Enclave, Health City', { align: 'center' })
    .text(`Phone: ${hospital.phone || '+91 80 2345 6789'} | Email: ${hospital.email || 'care@adyapan.com'}`, { align: 'center' });

  doc.moveDown(0.5);
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);

  // 2. Doctor & Patient Header Box
  const topY = doc.y;

  // Left column: Doctor Info
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(doctorUser.name ? `Dr. ${doctorUser.name}` : 'Attending Physician', 45, topY);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Specialty: ${doctor.specialization || dept.name || 'General Practice'}`)
    .text(`Department: ${dept.name || 'OPD'}`)
    .text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);

  // Right column: Patient Info
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(`Patient: ${patient.fullName || 'N/A'}`, 320, topY);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`UHID: ${patient.uhid || 'N/A'}`, 320)
    .text(`Gender: ${patient.gender || '--'} | Blood: ${patient.bloodGroup || 'N/A'}`, 320)
    .text(`Phone: ${patient.phone || '--'}`, 320)
    .text(`Rx Code: ${prescription.prescriptionCode}`, 320);

  doc.moveDown(1.2);
  doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);

  // 3. Clinical Diagnosis & Vitals
  if (consultation.diagnosis) {
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0369a1')
      .text('Clinical Diagnosis: ', { continued: true })
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(consultation.diagnosis);
    doc.moveDown(0.5);
  }

  if (consultation.symptoms) {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text('Symptoms / Chief Complaints: ', { continued: true })
      .font('Helvetica')
      .text(consultation.symptoms);
    doc.moveDown(0.8);
  }

  // 4. Rx Symbol & Prescription Items Table Header
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#0284c7')
    .text('℞ Prescribed Medications');

  doc.moveDown(0.4);

  // Table header background
  const tableHeaderY = doc.y;
  doc.rect(45, tableHeaderY, 505, 20).fill('#f1f5f9');
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#334155')
    .text('Medicine & Dosage', 50, tableHeaderY + 5)
    .text('Frequency', 240, tableHeaderY + 5)
    .text('Duration', 340, tableHeaderY + 5)
    .text('Instructions', 430, tableHeaderY + 5);

  let currentY = tableHeaderY + 24;

  const items = prescription.items || [];
  items.forEach((item, index) => {
    const medName = item.medicine?.name || 'Medication';
    const dosage = item.dosage || '';
    const freq = item.frequency || '-';
    const dur = item.duration || '-';
    const instr = item.instructions || 'As directed';

    if (index % 2 === 1) {
      doc.rect(45, currentY - 2, 505, 18).fill('#f8fafc');
    }

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(`${medName} (${dosage})`, 50, currentY, { width: 180 })
      .font('Helvetica')
      .fillColor('#334155')
      .text(freq, 240, currentY)
      .text(dur, 340, currentY)
      .text(instr, 430, currentY, { width: 115 });

    currentY += 22;
  });

  doc.y = currentY + 10;
  doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);

  // 5. Advice & Follow-Up
  if (consultation.advice) {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Clinical Advice / Regimen:')
      .font('Helvetica')
      .fillColor('#334155')
      .text(consultation.advice);
    doc.moveDown(0.5);
  }

  if (consultation.followUpDate) {
    const fDate = new Date(consultation.followUpDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0284c7')
      .text(`Recommended Next Visit / Follow-Up: ${fDate}`);
    doc.moveDown(0.5);
  }

  // 6. Doctor Signature Block
  doc.moveDown(2);
  const sigY = doc.y;
  doc
    .strokeColor('#94a3b8')
    .lineWidth(1)
    .moveTo(380, sigY + 30)
    .lineTo(540, sigY + 30)
    .stroke();

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(doctorUser.name ? `Dr. ${doctorUser.name}` : 'Physician Signature', 380, sigY + 35, { align: 'center', width: 160 })
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
    .text('Registered Medical Practitioner', 380, sigY + 47, { align: 'center', width: 160 });

  // 7. Footer
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      `Generated by Adyapan Hospital Queue & Appointment System on ${new Date().toLocaleString('en-IN')} | Valid prescription under applicable Telemedicine / Clinical Establishment Guidelines.`,
      45,
      780,
      { align: 'center', width: 505 }
    );

  doc.end();
}

/**
 * Generate official Hospital Tax Invoice & Patient Receipt PDF stream using PDFKit
 * @param {Object} invoice - Complete relational invoice object
 * @param {import('express').Response} res - Express response stream
 */
export function generateInvoicePdf(invoice, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Invoice_${invoice.invoiceNumber || 'INV'}.pdf"`
  );

  doc.pipe(res);

  const hospital = invoice.hospital || {};
  const patient = invoice.patient || {};
  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const balanceDue = Math.max(0, (invoice.totalAmount || 0) - (invoice.paidAmount || 0) + (invoice.refundedAmount || 0));

  // 1. Hospital Header
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#0284c7')
    .text(hospital.name || 'Adyapan Central Hospital & Clinic', { align: 'center' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(hospital.address || 'Plot 42, Health City, Medical Enclave', { align: 'center' })
    .text(`GSTIN: 29AAAAA0000A1Z5 | Phone: ${hospital.phone || '+91 80 2345 6789'}`, { align: 'center' });

  doc.moveDown(0.5);
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);

  // 2. Invoice Meta & Patient Details
  const topY = doc.y;

  // Left column: Billed Patient Info
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Billed To:', 45, topY);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Name: ${patient.fullName || 'Walk-in Patient'}`)
    .text(`UHID: ${patient.uhid || '--'}`)
    .text(`Phone: ${patient.phone || '--'}`)
    .text(`Gender: ${patient.gender || '--'} | Blood: ${patient.bloodGroup || '--'}`);

  // Right column: Invoice Meta
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(`Tax Invoice: ${invoice.invoiceNumber}`, 320, topY);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 320)
    .text(`Payment Status: ${invoice.paymentStatus}`, 320)
    .text(`Appointment Ref: ${invoice.appointmentId ? invoice.appointmentId.slice(0, 8) : 'Direct Intake'}`, 320);

  doc.moveDown(1.5);

  // 3. Line Items Table
  const tableHeaderY = doc.y;
  doc.rect(45, tableHeaderY, 505, 20).fill('#0f172a');
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text('#', 55, tableHeaderY + 5)
    .text('Description / Service Item', 80, tableHeaderY + 5)
    .text('Qty', 330, tableHeaderY + 5)
    .text('Unit Price', 380, tableHeaderY + 5)
    .text('Amount (₹)', 470, tableHeaderY + 5, { align: 'right', width: 70 });

  let currentY = tableHeaderY + 24;

  items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.rect(45, currentY - 2, 505, 18).fill('#f8fafc');
    }

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(String(index + 1), 55, currentY)
      .text(item.description, 80, currentY, { width: 240 })
      .text(String(item.quantity), 330, currentY)
      .text(`₹${Number(item.unitPrice).toFixed(2)}`, 380, currentY)
      .text(`₹${Number(item.totalPrice).toFixed(2)}`, 470, currentY, { align: 'right', width: 70 });

    currentY += 20;
  });

  doc.y = currentY + 10;
  doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  // 4. Financial Totals Section
  const totalsY = doc.y;
  const leftColX = 330;
  const rightColX = 470;

  doc.fontSize(9).font('Helvetica').fillColor('#475569');
  doc.text('Subtotal:', leftColX, totalsY).text(`₹${Number(invoice.totalAmount - (invoice.tax || 0) + (invoice.discount || 0)).toFixed(2)}`, rightColX, totalsY, { align: 'right', width: 70 });
  
  doc.text('Discount:', leftColX, totalsY + 16).text(`- ₹${Number(invoice.discount || 0).toFixed(2)}`, rightColX, totalsY + 16, { align: 'right', width: 70 });
  doc.text('Taxes (GST):', leftColX, totalsY + 32).text(`+ ₹${Number(invoice.tax || 0).toFixed(2)}`, rightColX, totalsY + 32, { align: 'right', width: 70 });

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(leftColX, totalsY + 48).lineTo(550, totalsY + 48).stroke();

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Net Total:', leftColX, totalsY + 54)
    .text(`₹${Number(invoice.totalAmount).toFixed(2)}`, rightColX, totalsY + 54, { align: 'right', width: 70 });

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#059669')
    .text('Paid Amount:', leftColX, totalsY + 74)
    .text(`₹${Number(invoice.paidAmount).toFixed(2)}`, rightColX, totalsY + 74, { align: 'right', width: 70 });

  if (invoice.refundedAmount > 0) {
    doc
      .fillColor('#dc2626')
      .text('Refunded Amount:', leftColX, totalsY + 90)
      .text(`- ₹${Number(invoice.refundedAmount).toFixed(2)}`, rightColX, totalsY + 90, { align: 'right', width: 70 });
  }

  const finalDueY = totalsY + (invoice.refundedAmount > 0 ? 108 : 92);
  doc
    .font('Helvetica-Bold')
    .fillColor(balanceDue > 0 ? '#b91c1c' : '#059669')
    .text('Balance Due:', leftColX, finalDueY)
    .text(`₹${Number(balanceDue).toFixed(2)}`, rightColX, finalDueY, { align: 'right', width: 70 });

  // 5. Payment & Refund Transaction Audit
  doc.y = finalDueY + 25;
  if (payments.length > 0) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Payment & Refund Ledger:');
    doc.moveDown(0.3);

    payments.forEach((p) => {
      const isRefund = p.type === 'REFUND';
      const color = isRefund ? '#dc2626' : '#059669';
      const sign = isRefund ? '-' : '+';
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(color)
        .text(
          `• ${new Date(p.createdAt).toLocaleDateString('en-IN')} | ${p.type} [${p.paymentMethod}] ${sign}₹${Number(p.amount).toFixed(2)} | Ref: ${p.transactionRef || 'Counter'} | Status: ${p.status}${p.refundReason ? ` | Reason: ${p.refundReason}` : ''}`
        );
    });
  }

  // 6. Watermark Stamp
  if (invoice.paymentStatus === 'PAID') {
    doc
      .save()
      .rotate(-20, { origin: [150, 420] })
      .fontSize(38)
      .font('Helvetica-Bold')
      .fillColor('#059669', 0.15)
      .text('PAID IN FULL', 100, 400)
      .restore();
  } else if (invoice.paymentStatus === 'REFUNDED') {
    doc
      .save()
      .rotate(-20, { origin: [150, 420] })
      .fontSize(38)
      .font('Helvetica-Bold')
      .fillColor('#dc2626', 0.15)
      .text('REFUNDED', 100, 400)
      .restore();
  }

  // 7. Footer
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      `Official Computer Generated Tax Invoice & Cash Memo | Thank you for trusting Adyapan Healthcare Systems.`,
      45,
      780,
      { align: 'center', width: 505 }
    );

  doc.end();
}
