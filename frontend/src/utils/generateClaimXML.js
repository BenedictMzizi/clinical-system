export function generateClaimXML({ practice, patient, billing }) {
  return `
<MedicalClaim>
  <Practice>
    <Name>${practice.name}</Name>
    <PracticeCode>${practice.code}</PracticeCode>
  </Practice>

  <Patient>
    <Name>${patient.full_name}</Name>
    <MedicalAid>${billing.medical_aid_name}</MedicalAid>
    <Membership>${billing.medical_aid_number}</Membership>
  </Patient>

  <Consultation>
    <Amount>${billing.total_amount}</Amount>
  </Consultation>
</MedicalClaim>`;
}
