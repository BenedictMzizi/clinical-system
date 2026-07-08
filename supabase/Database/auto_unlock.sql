CREATE OR REPLACE FUNCTION auto_unlock_stale_visits()
RETURNS void AS $$
BEGIN
  UPDATE visits
  SET
    status = 'REGISTERED',
    consulting_doctor = NULL,
    consulting_started_at = NULL,
    updated_at = now()
  WHERE
    status = 'OPEN'
    AND consulting_started_at < now() - interval '60 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
