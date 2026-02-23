CREATE OR REPLACE VIEW pharmacy_audit_view AS
SELECT
  pd.dispensed_at,
  pd.medication,
  pd.quantity,
  prof.full_name AS dispensed_by,
  v.id           AS visit_id
FROM pharmacy_dispense pd
JOIN profiles prof ON prof.id = pd.dispensed_by
JOIN visits v      ON v.id = pd.visit_id;
