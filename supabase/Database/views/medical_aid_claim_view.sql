CREATE OR REPLACE VIEW medical_aid_claim_view AS
SELECT
  br.id                AS billing_id,
  v.id                 AS visit_id,

  -- ✅ FIXED
  p.full_name          AS patient_name,

  br.medical_aid_name,
  br.medical_aid_number,
  br.total_amount      AS claim_amount,

  pr.prescription_number,
  pr.created_at        AS prescription_date,

  prof.full_name       AS doctor_name,
  prof.id              AS doctor_id,

  v.practice_id
FROM billing_records br
JOIN visits v            ON v.id = br.visit_id
JOIN patients p          ON p.id = v.patient_id
JOIN prescriptions pr    ON pr.visit_id = v.id
JOIN profiles prof       ON prof.id = v.consulting_doctor
WHERE br.billing_type IN ('medical_aid','state')
  AND br.cleared = true;
