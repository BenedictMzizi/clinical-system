export function generateMedicalAidXML(billing, patient, consultation) {
  const xml = `
<MedicalClaim>
  <Patient>
    <Name>${patient.full_name}</Name>
    <ID>${patient.id_number}</ID>
  </Patient>
  <Consultation>
    <Assessment>${consultation.assessment}</Assessment>
    <Plan>${consultation.plan}</Plan>
  </Consultation>
  <Billing>
    <MedicalAid>${billing.medical_aid_name}</MedicalAid>
    <MemberNumber>${billing.medical_aid_number}</MemberNumber>
    <Amount>${billing.total_amount}</Amount>
  </Billing>
</MedicalClaim>
`.trim();

  const blob = new Blob([xml], { type: "application/xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `claim-${billing.id}.xml`;
  link.click();
}
