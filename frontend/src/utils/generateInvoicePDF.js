import jsPDF from "jspdf";

export function generateInvoicePDF({ practice, patient, billing, visit }) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(practice.name, 20, 20);
  doc.setFontSize(10);
  doc.text(practice.address || "", 20, 26);

  doc.line(20, 30, 190, 30);

  doc.text(`Patient: ${patient.full_name}`, 20, 40);
  doc.text(`Visit ID: ${visit.id}`, 20, 46);
  doc.text(`Billing Type: ${billing.billing_type}`, 20, 52);

  doc.text(`Total: R ${billing.total_amount}`, 20, 64);
  doc.text(`Paid: R ${billing.amount_paid}`, 20, 70);

  doc.text("Authorised by Practice", 20, 90);
  doc.line(20, 95, 80, 95);

  doc.save(`invoice-${visit.id}.pdf`);
}
