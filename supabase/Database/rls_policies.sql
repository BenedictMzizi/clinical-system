-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_settings ENABLE ROW LEVEL SECURITY;

--------------------------------------------------
-- PROFILES
--------------------------------------------------

CREATE POLICY "select own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "it manage profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'it'
  )
);

--------------------------------------------------
-- PATIENTS
--------------------------------------------------

CREATE POLICY "staff read patients"
ON patients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','receptionist','consultant','pharmacist','it')
  )
);

CREATE POLICY "reception update patients"
ON patients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('receptionist','admin')
  )
);

--------------------------------------------------
-- VISITS (HARD LOCK)
--------------------------------------------------

CREATE POLICY "staff read visits"
ON visits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','receptionist','consultant','pharmacist','it')
  )
);

CREATE POLICY "reception insert visits"
ON visits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('receptionist','admin')
  )
);

CREATE POLICY "consultant exclusive lock"
ON visits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'consultant'
  )
  AND (consulting_doctor IS NULL OR consulting_doctor = auth.uid())
)
WITH CHECK (
  consulting_doctor = auth.uid()
);

--------------------------------------------------
-- CONSULTATIONS
--------------------------------------------------

CREATE POLICY "consultant own visit consultation"
ON consultations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM visits
    WHERE visits.id = consultations.visit_id
    AND visits.consulting_doctor = auth.uid()
  )
);


--------------------------------------------------
-- PRESCRIPTIONS
--------------------------------------------------

CREATE POLICY "pharmacist access prescriptions"
ON prescriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'pharmacist'
  )
);

--------------------------------------------------
-- AUDIT LOGS
--------------------------------------------------

CREATE POLICY "admin audit read"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','it')
  )
);


CREATE POLICY "Admin manage practice"
ON practice_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'it')
  )
);


-- PRESCRIPTIONS RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practice scoped prescriptions"
ON prescriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM practice_users pu
    WHERE pu.practice_id = prescriptions.practice_id
      AND pu.user_id = auth.uid()
  )
);

CREATE POLICY doctor_read_only_after_claim
ON consultations
FOR UPDATE
USING (locked = false);

CREATE POLICY reception_billing_only
ON billing_records
FOR ALL
USING (true);

CREATE POLICY "admin read billing"
ON billing_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM practice_users pu
    JOIN profiles p ON p.id = pu.user_id
    WHERE pu.practice_id = billing_records.practice_id
      AND pu.user_id = auth.uid()
      AND p.role = 'admin'
  )
);
