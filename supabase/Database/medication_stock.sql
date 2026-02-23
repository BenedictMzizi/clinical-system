CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION dispense_medication(
  p_visit_id UUID,
  p_medication TEXT,
  p_quantity INTEGER,
  p_note TEXT
)
RETURNS void AS $$
BEGIN
  -- Check stock
  IF (SELECT stock FROM medications WHERE name = p_medication) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  -- Deduct stock
  UPDATE medications
  SET stock = stock - p_quantity
  WHERE name = p_medication;

  -- Update prescription
  UPDATE prescriptions
  SET
    status = 'DISPENSED',
    pharmacist_note = p_note
  WHERE visit_id = p_visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
