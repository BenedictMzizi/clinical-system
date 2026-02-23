import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generates and triggers download of a styled medical prescription PDF.
 * @param {object} params
 * @param {object} params.practice - Practice info (name, address, phone, email, logoUrl)
 * @param {object} params.doctor - Doctor info (name, registration, specialty)
 * @param {object} params.patient - Patient info (full_name, id_number)
 * @param {object} params.visit - Visit info (reference)
 * @param {Array} params.medications - Array of medication objects
 * @param {string} [params.prescriptionNumber] - Prescription number string (optional)
 */
export async function generatePrescriptionPDF({
  practice,
  doctor,
  patient,
  visit,
  medications,
  prescriptionNumber,
}) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]); // A4 size
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 800;

  if (practice.logo_url) {
    try {
      const logoImageBytes = await fetch(practice.logo_url).then((res) =>
        res.arrayBuffer()
      );
      const logoImage = await pdf.embedPng(logoImageBytes);
      const pngDims = logoImage.scale(0.15);
      page.drawImage(logoImage, {
        x: 50,
        y: y - pngDims.height,
        width: pngDims.width,
        height: pngDims.height,
      });
    } catch (e) {
      console.warn("Failed to load practice logo:", e);
    }
  }

  page.drawText(practice.name || "", { x: 50, y, size: 18, font, color: rgb(0, 0, 0) });
  y -= 20;
  if (practice.address) page.drawText(practice.address, { x: 50, y, size: 10, font });
  y -= 14;
  page.drawText(
    `Tel: ${practice.phone || ""} | Email: ${practice.email || ""}`,
    { x: 50, y, size: 10, font }
  );

  y -= 30;
  page.drawText("MEDICAL PRESCRIPTION", { x: 180, y, size: 16, font });

  if (prescriptionNumber) {
    y -= 20;
    page.drawText(`Prescription No: ${prescriptionNumber}`, { x: 50, y, size: 12, font });
  }

  y -= 40;
  page.drawText(`Patient: ${patient.full_name || ""}`, { x: 50, y, size: 12, font });
  y -= 14;
  if (patient.id_number)
    page.drawText(`ID Number: ${patient.id_number}`, { x: 50, y, size: 12, font });
  y -= 14;
  page.drawText(`Visit Ref: ${visit.reference || visit.id || ""}`, { x: 50, y, size: 12, font });

  y -= 30;
  page.drawText("Prescribed Medication:", { x: 50, y, size: 13, font });

  y -= 20;
  for (let i = 0; i < medications.length; i++) {
    const med = medications[i];
    page.drawText(
      `${i + 1}. ${med.name || ""} ${med.dosage || ""} – ${med.frequency || ""} for ${
        med.duration || ""
      }`,
      { x: 60, y, size: 11, font }
    );
    y -= 14;
    if (med.notes) {
      page.drawText(`Notes: ${med.notes}`, {
        x: 70,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 14;
    }
    if (y < 100 && i < medications.length - 1) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
  }

  y = 160;
  page.drawText("Doctor Signature & Stamp:", { x: 50, y, size: 12, font });
  y -= 40;
  page.drawText(doctor.name || "", { x: 50, y, size: 12, font });
  y -= 14;
  page.drawText(`Reg No: ${doctor.registration || ""}`, { x: 50, y, size: 11, font });
  y -= 14;
  if (doctor.specialty) {
    page.drawText(doctor.specialty, { x: 50, y, size: 11, font });
  }

  y = 40;
  page.drawText(
    "This prescription is electronically generated and valid without signature.",
    { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }
  );

  const bytes = await pdf.save();

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Prescription_${patient.full_name?.replace(/\s/g, "_") || "unknown"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
