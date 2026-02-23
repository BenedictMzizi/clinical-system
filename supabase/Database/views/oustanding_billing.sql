CREATE OR REPLACE VIEW outstanding_billing AS
SELECT
  br.id,
  br.visit_id,
  br.billing_type,
  br.total_amount,
  br.amount_paid,
  br.status,
  br.created_at
FROM billing_records br
WHERE br.cleared = false
ORDER BY br.created_at ASC;
