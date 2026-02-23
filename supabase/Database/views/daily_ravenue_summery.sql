CREATE OR REPLACE VIEW daily_revenue_summary AS
SELECT
  DATE(br.created_at)         AS day,
  br.billing_type,
  COUNT(*)                    AS visits,
  SUM(br.total_amount)        AS total_billed
FROM billing_records br
WHERE br.cleared = true
GROUP BY DATE(br.created_at), br.billing_type
ORDER BY day DESC;
