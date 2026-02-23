import jsPDF from "jspdf";

export function generateReceiptPDF(billing, patient) {
  const doc = new jsPDF();

  doc.text("PAYMENT RECEIPT", 20, 20);
  doc.text(`Patient: ${patient.full_name}`, 20, 30);
  doc.text(`Billing Type: ${billing.billing_type}`, 20, 40);
  doc.text(`Total: R ${billing.total_amount}`, 20, 50);
  doc.text(`Paid: R ${billing.amount_paid}`, 20, 60);
  doc.text(`Status: ${billing.status}`, 20, 70);
  doc.text(`Date: ${new Date(billing.verified_at).toLocaleString()}`, 20, 80);

  doc.save(`receipt-${billing.id}.pdf`);
}
