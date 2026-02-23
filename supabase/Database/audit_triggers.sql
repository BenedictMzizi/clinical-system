CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id
  )
  SELECT
    auth.uid(),
    p.role,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)
  FROM profiles p
  WHERE p.id = auth.uid();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER audit_patients
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_visits
AFTER INSERT OR UPDATE OR DELETE ON visits
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_consultations
AFTER INSERT OR UPDATE OR DELETE ON consultations
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_prescriptions
AFTER INSERT OR UPDATE OR DELETE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE OR REPLACE FUNCTION prevent_doctor_snapshot_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.doctor_snapshot IS DISTINCT FROM OLD.doctor_snapshot THEN
    RAISE EXCEPTION 'doctor_snapshot cannot be modified once set';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_doctor_snapshot
BEFORE UPDATE ON consultations
FOR EACH ROW
WHEN (OLD.doctor_snapshot IS NOT NULL)
EXECUTE FUNCTION prevent_doctor_snapshot_change();
