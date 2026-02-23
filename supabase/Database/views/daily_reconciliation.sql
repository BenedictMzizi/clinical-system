CREATE OR REPLACE VIEW daily_cash_reconciliation AS
SELECT
  DATE(br.verified_at)        AS day,
  COUNT(*)                    AS transactions,
  SUM(br.amount_paid)         AS total_cash_received
FROM billing_records br
WHERE br.billing_type = 'cash'
  AND br.cleared = true
GROUP BY DATE(br.verified_at)
ORDER BY day DESC;
