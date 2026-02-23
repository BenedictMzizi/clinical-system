CREATE OR REPLACE VIEW kpi_dashboard_view AS
SELECT
  -- Visits today
  (SELECT COUNT(*)
   FROM visits
   WHERE created_at::date = CURRENT_DATE) AS visits_today,

  -- Average consultation time (minutes)
  (SELECT COALESCE(
     ROUND(
       AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)::numeric, 2
     ), 0
   )
   FROM consultations
   WHERE ended_at IS NOT NULL
  ) AS avg_consult_time,

  -- Live reception queue
  (SELECT COUNT(*)
   FROM visits
   WHERE status = 'OPEN'
  ) AS active_queue,

  -- Medications dispensed today
  (SELECT COUNT(*)
   FROM pharmacy_dispense
   WHERE created_at::date = CURRENT_DATE
  ) AS medications_dispensed,

  -- Out-of-stock events today
  (SELECT COUNT(*)
   FROM pharmacy_dispense
   WHERE out_of_stock = TRUE
     AND created_at::date = CURRENT_DATE
  ) AS out_of_stock,

  -- Doctors currently consulting
  (SELECT COUNT(DISTINCT user_id)
   FROM consultations
   WHERE ended_at IS NULL
  ) AS active_doctors;
