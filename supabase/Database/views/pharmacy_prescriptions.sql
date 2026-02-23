CREATE OR REPLACE VIEW pharmacy_prescriptions_view AS
SELECT
  p.id,
  p.prescription_number,
  p.medications,
  p.doctor_snapshot,
  p.created_at,

  pt.full_name AS patient_name,
  pt.id_number,

  ps.address,
  ps.phone,
  ps.email,
  pr.name AS practice_name

FROM prescriptions p
JOIN visits v ON v.id = p.visit_id
JOIN patients pt ON pt.id = v.patient_id
JOIN practices pr ON pr.id = v.practice_id
JOIN practice_settings ps ON ps.practice_id = pr.id;
