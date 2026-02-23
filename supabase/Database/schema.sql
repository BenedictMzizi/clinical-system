-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE visit_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE billing_type AS ENUM ('cash', 'medical_aid', 'state');
CREATE TYPE prescription_status AS ENUM ('PENDING', 'DISPENSED');

-- =====================================================
-- PROFILES (Supabase auth users)
-- =====================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text CHECK (role IN ('admin','doctor','reception','pharmacy')),
  practice_id uuid,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PRACTICES
-- =====================================================
CREATE TABLE practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PATIENTS
-- =====================================================
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  id_number text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- VISITS (central business entity)
-- =====================================================
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  consulting_doctor uuid REFERENCES profiles(id),
  practice_id uuid REFERENCES practices(id),
  status visit_status DEFAULT 'OPEN',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- CONSULTATIONS (1:1 with visit)
-- =====================================================
CREATE TABLE consultations (
  visit_id uuid PRIMARY KEY REFERENCES visits(id) ON DELETE CASCADE,
  symptoms text,
  diagnosis text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PRESCRIPTIONS (FINAL VERSION)
-- =====================================================
CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  practice_id uuid REFERENCES practices(id),
  prescription_number text UNIQUE NOT NULL,
  medications jsonb NOT NULL,
  doctor_snapshot jsonb NOT NULL,
  status prescription_status DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING RECORDS (VISIT-BASED)
-- =====================================================
CREATE TABLE billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  billing_type billing_type NOT NULL,
  amount numeric(10,2) NOT NULL,
  cleared boolean DEFAULT false,
  medical_aid_name text,
  medical_aid_number text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PHARMACY DISPENSE AUDIT
-- =====================================================
CREATE TABLE pharmacy_dispense (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  medication text NOT NULL,
  quantity integer NOT NULL,
  note text,
  dispensed_by uuid REFERENCES profiles(id),
  dispensed_at timestamptz DEFAULT now()
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- 🔢 Prescription number generator
CREATE OR REPLACE FUNCTION generate_prescription_number(p_practice_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq integer;
BEGIN
  SELECT COALESCE(MAX(split_part(prescription_number, '-', 3)::int), 0) + 1
  INTO seq
  FROM prescriptions
  WHERE practice_id = p_practice_id;

  RETURN 'RX-' || substring(p_practice_id::text,1,6) || '-' || lpad(seq::text,6,'0');
END;
$$;

-- 💊 Dispense medication (FINAL & UNIQUE)
CREATE OR REPLACE FUNCTION dispense_medication(
  p_visit_id uuid,
  p_medication text,
  p_quantity integer,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Billing gate
  IF NOT EXISTS (
    SELECT 1
    FROM billing_records
    WHERE visit_id = p_visit_id
      AND (cleared = true OR billing_type IN ('medical_aid','state'))
  ) THEN
    RAISE EXCEPTION 'Billing not cleared or approved';
  END IF;

  -- Audit dispense
  INSERT INTO pharmacy_dispense (
    visit_id,
    medication,
    quantity,
    note,
    dispensed_by
  )
  VALUES (
    p_visit_id,
    p_medication,
    p_quantity,
    p_note,
    auth.uid()
  );

  -- Mark prescription as dispensed
  UPDATE prescriptions
  SET status = 'DISPENSED'
  WHERE visit_id = p_visit_id;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_dispense ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (expand as needed)

CREATE POLICY "Doctors view their visits"
ON visits
FOR SELECT
USING (consulting_doctor = auth.uid());

CREATE POLICY "Reception manage billing"
ON billing_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('reception','admin')
  )
);

CREATE POLICY "Pharmacy dispense only"
ON pharmacy_dispense
FOR INSERT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'pharmacy'
  )
);


ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE invoice_seq START 100000;

ALTER TABLE billing_records
ADD COLUMN invoice_number bigint
DEFAULT nextval('invoice_seq');

CREATE OR REPLACE FUNCTION assert_billing_cleared(p_visit_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM billing_records
    WHERE visit_id = p_visit_id
      AND cleared = true
  ) THEN
    RAISE EXCEPTION 'Billing not cleared';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id),
  action text,
  entity text,
  entity_id uuid,
  created_at timestamptz default now()
);

CREATE VIEW daily_reconciliation AS
SELECT
  date(br.created_at) AS day,
  br.billing_type,
  count(*) AS transactions,
  sum(br.total_amount) AS total
FROM billing_records br
WHERE br.cleared = true
GROUP BY 1,2
ORDER BY day DESC;

CREATE POLICY "admin full access"
ON billing_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);

CREATE POLICY "pharmacy view cleared only"
ON billing_records
FOR SELECT
USING (
  cleared = true
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'pharmacy'
  )
);

CREATE FUNCTION dispense_medication(
    p_prescription_id UUID,
    p_pharmacist_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

    -- Ensure prescription exists and is not dispensed
    IF NOT EXISTS (
        SELECT 1
        FROM prescriptions
        WHERE id = p_prescription_id
        AND dispensed_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Prescription invalid or already dispensed';
    END IF;

    -- Mark dispensed
    UPDATE prescriptions
    SET
        dispensed_at = NOW(),
        dispensed_by = p_pharmacist_id,
        updated_at = NOW()
    WHERE id = p_prescription_id;

END;
$$;



CREATE FUNCTION generate_medical_aid_claim(
    p_visit_id UUID
)
RETURNS TABLE (
    claim_id UUID,
    patient_name TEXT,
    doctor_name TEXT,
    practice_number TEXT,
    amount NUMERIC,
    claim_date TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

RETURN QUERY

SELECT
    br.id,
    pat.first_name || ' ' || pat.last_name,
    doc.first_name || ' ' || doc.last_name,
    doc.practice_number,
    br.total_amount,
    br.created_at

FROM billing_records br

JOIN visits v ON br.visit_id = v.id

JOIN profiles pat ON pat.id = v.patient_id

JOIN profiles doc ON doc.id = v.doctor_id

WHERE br.visit_id = p_visit_id;

END;
$$;

REVOKE ALL ON FUNCTION dispense_medication(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dispense_medication(uuid,uuid) TO authenticated;

REVOKE ALL ON FUNCTION generate_medical_aid_claim(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_medical_aid_claim(uuid) TO authenticated;

