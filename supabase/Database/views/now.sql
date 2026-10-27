-- HWMS additive schema migration: multi-facility workflow foundation
-- Target: Supabase PostgreSQL. Back up first and test on staging.
-- Existing `practices` remains the physical facility table to preserve practice_id compatibility.
-- This migration creates new tables and adds organisation linkage; it does not drop legacy tables.

begin;

create extension if not exists pgcrypto;

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practices
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists facility_type text not null default 'CLINIC',
  add column if not exists is_active boolean not null default true,
  add column if not exists timezone text not null default 'Africa/Johannesburg';

-- Give existing sites an organisation so existing installations can migrate gradually.
do $$
declare r record;
declare new_org uuid;
begin
  for r in select id, name, code from public.practices where organisation_id is null loop
    insert into public.organisations(name, code)
    values (r.name, 'ORG-' || upper(replace(left(r.code, 24), ' ', '-')) || '-' || left(r.id::text, 8))
    returning id into new_org;
    update public.practices set organisation_id = new_org where id = r.id;
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'practices_facility_type_check'
      and conrelid = 'public.practices'::regclass
  ) then
    alter table public.practices
      add constraint practices_facility_type_check
      check (facility_type in ('CLINIC','HOSPITAL','DAY_CLINIC','DIAGNOSTIC_CENTRE'))
      not valid;
  end if;
end $$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  code text not null,
  name text not null,
  department_type text not null default 'GENERAL',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, code),
  unique (id, practice_id)
);

create table if not exists public.staff_facility_roles (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  department_id uuid,
  is_active boolean not null default true,
  granted_by uuid,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint staff_role_department_same_facility_fk
    foreign key (department_id, practice_id)
    references public.departments(id, practice_id),
  unique (practice_id, user_id, role, department_id)
);
create index if not exists idx_staff_facility_roles_user on public.staff_facility_roles(user_id, practice_id) where is_active;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  patient_id uuid not null references public.patients(id),
  department_id uuid,
  clinician_id uuid,
  appointment_type text not null default 'CONSULTATION',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'BOOKED'
    check (status in ('BOOKED','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
  reason text,
  notes text,
  checked_in_at timestamptz,
  created_by uuid,
  cancelled_by uuid,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (department_id, practice_id) references public.departments(id, practice_id)
);
create index if not exists idx_appointments_facility_start on public.appointments(practice_id, starts_at);
create index if not exists idx_appointments_patient on public.appointments(practice_id, patient_id, starts_at desc);

create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  department_id uuid,
  code text not null,
  name text not null,
  ward_type text not null default 'GENERAL',
  gender_policy text not null default 'ANY' check (gender_policy in ('ANY','MALE','FEMALE','OTHER')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, code),
  unique (id, practice_id),
  foreign key (department_id, practice_id) references public.departments(id, practice_id)
);

create table if not exists public.beds (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  ward_id uuid not null,
  bed_number text not null,
  status text not null default 'AVAILABLE'
    check (status in ('AVAILABLE','OCCUPIED','RESERVED','OUT_OF_SERVICE')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ward_id, bed_number),
  unique (id, practice_id),
  foreign key (ward_id, practice_id) references public.wards(id, practice_id)
);

create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  patient_id uuid not null references public.patients(id),
  visit_id uuid references public.visits(id),
  admission_number text not null,
  admitting_clinician_id uuid,
  admitted_at timestamptz not null default now(),
  expected_discharge_at timestamptz,
  discharged_at timestamptz,
  discharge_summary text,
  status text not null default 'ADMITTED'
    check (status in ('PLANNED','ADMITTED','TRANSFERRED','DISCHARGED','CANCELLED')),
  created_by uuid,
  discharged_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, admission_number),
  unique (id, practice_id)
);
create unique index if not exists uq_admission_one_open_per_patient
  on public.admissions(practice_id, patient_id)
  where status in ('PLANNED','ADMITTED','TRANSFERRED');

-- History of each bed allocation/transfer; ended rows are retained for audit.
create table if not exists public.bed_movements (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  admission_id uuid not null,
  bed_id uuid not null,
  moved_in_at timestamptz not null default now(),
  moved_out_at timestamptz,
  moved_in_by uuid,
  moved_out_by uuid,
  reason text,
  created_at timestamptz not null default now(),
  foreign key (admission_id, practice_id) references public.admissions(id, practice_id),
  foreign key (bed_id, practice_id) references public.beds(id, practice_id),
  check (moved_out_at is null or moved_out_at >= moved_in_at)
);
create unique index if not exists uq_bed_one_current_occupant
  on public.bed_movements(bed_id) where moved_out_at is null;
create unique index if not exists uq_admission_one_current_bed
  on public.bed_movements(admission_id) where moved_out_at is null;

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  patient_id uuid not null references public.patients(id),
  visit_id uuid references public.visits(id),
  department_id uuid,
  order_number text not null,
  test_code text not null,
  test_name text not null,
  specimen_type text,
  priority text not null default 'ROUTINE' check (priority in ('ROUTINE','URGENT','STAT')),
  status text not null default 'ORDERED'
    check (status in ('ORDERED','COLLECTED','RECEIVED','PROCESSING','RESULTED','VERIFIED','CANCELLED')),
  clinical_indication text,
  ordered_by uuid not null,
  ordered_at timestamptz not null default now(),
  collected_at timestamptz,
  resulted_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, order_number),
  foreign key (department_id, practice_id) references public.departments(id, practice_id)
);
create index if not exists idx_lab_orders_worklist on public.lab_orders(practice_id, status, priority, ordered_at);

create table if not exists public.lab_specimens (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  lab_order_id uuid not null references public.lab_orders(id) on delete cascade,
  specimen_number text not null,
  specimen_type text not null,
  collected_by uuid,
  collected_at timestamptz,
  received_by uuid,
  received_at timestamptz,
  condition_notes text,
  status text not null default 'PENDING'
    check (status in ('PENDING','COLLECTED','RECEIVED','REJECTED','PROCESSED')),
  created_at timestamptz not null default now(),
  unique (practice_id, specimen_number)
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  lab_order_id uuid not null references public.lab_orders(id) on delete cascade,
  analyte_code text,
  analyte_name text not null,
  result_value text not null,
  unit text,
  reference_range text,
  abnormal_flag text check (abnormal_flag is null or abnormal_flag in ('LOW','NORMAL','HIGH','CRITICAL','ABNORMAL')),
  comment text,
  entered_by uuid not null,
  entered_at timestamptz not null default now(),
  verified_by uuid,
  verified_at timestamptz,
  version integer not null default 1,
  supersedes_result_id uuid references public.lab_results(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_lab_results_order on public.lab_results(practice_id, lab_order_id, entered_at desc);

create table if not exists public.imaging_orders (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  patient_id uuid not null references public.patients(id),
  visit_id uuid references public.visits(id),
  order_number text not null,
  modality text not null check (modality in ('XRAY','CT','MRI','ULTRASOUND','MAMMOGRAPHY','FLUOROSCOPY','OTHER')),
  body_site text,
  clinical_indication text,
  priority text not null default 'ROUTINE' check (priority in ('ROUTINE','URGENT','STAT')),
  status text not null default 'ORDERED'
    check (status in ('ORDERED','SCHEDULED','IN_PROGRESS','ACQUIRED','REPORTED','VERIFIED','CANCELLED')),
  ordered_by uuid not null,
  ordered_at timestamptz not null default now(),
  scheduled_at timestamptz,
  acquired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, order_number)
);
create index if not exists idx_imaging_worklist on public.imaging_orders(practice_id, status, priority, ordered_at);

-- Store identifiers and secure PACS/object-storage references, not large DICOM binaries.
create table if not exists public.imaging_studies (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  imaging_order_id uuid not null references public.imaging_orders(id) on delete cascade,
  study_instance_uid text not null,
  accession_number text,
  pacs_system text,
  secure_storage_uri text,
  modality text not null,
  study_description text,
  acquired_at timestamptz,
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  unique (practice_id, study_instance_uid),
  unique (practice_id, accession_number)
);

create table if not exists public.imaging_reports (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  imaging_study_id uuid not null references public.imaging_studies(id) on delete cascade,
  findings text,
  impression text not null,
  recommendations text,
  authored_by uuid not null,
  authored_at timestamptz not null default now(),
  verified_by uuid,
  verified_at timestamptz,
  status text not null default 'DRAFT' check (status in ('DRAFT','PRELIMINARY','FINAL','AMENDED')),
  amended_from uuid references public.imaging_reports(id),
  created_at timestamptz not null default now()
);

-- Composite key required by tenant-aware billing foreign keys; create before dependent tables.
create unique index if not exists uq_billing_id_practice on public.billing(id, practice_id);

-- Itemised charges support consultation, ward, lab, imaging, pharmacy and procedures.
create table if not exists public.billing_items (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  billing_id uuid not null references public.billing(id) on delete cascade,
  service_pricing_id uuid references public.service_pricing(id),
  service_code text,
  description text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  line_total numeric(12,2) generated always as (round(quantity * unit_price - discount_amount, 2)) stored,
  source_type text,
  source_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (discount_amount <= quantity * unit_price)
);
create index if not exists idx_billing_items_bill on public.billing_items(practice_id, billing_id);

-- Immutable tender ledger. Keep legacy `billing.paid_amount` as a compatibility summary only.
create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  billing_id uuid not null references public.billing(id),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('CASH','CARD','EFT','MEDICAL_AID','OTHER')),
  payment_reference text,
  transaction_id text,
  idempotency_key text not null,
  receipt_number text not null,
  received_by uuid not null,
  received_at timestamptz not null default now(),
  status text not null default 'POSTED' check (status in ('POSTED','REVERSED','REFUNDED')),
  notes text,
  unique (practice_id, idempotency_key),
  unique (practice_id, receipt_number),
  unique (id, practice_id),
  foreign key (billing_id, practice_id) references public.billing(id, practice_id)
);
create index if not exists idx_billing_payments_bill on public.billing_payments(practice_id, billing_id, received_at desc);

create table if not exists public.billing_refunds (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  payment_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  reason text not null,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','APPROVED','REJECTED','PROCESSED')),
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  approved_by uuid,
  approved_at timestamptz,
  processed_by uuid,
  processed_at timestamptz,
  refund_reference text,
  foreign key (payment_id, practice_id) references public.billing_payments(id, practice_id)
);
create index if not exists idx_billing_refunds_payment on public.billing_refunds(practice_id, payment_id);

-- Add tenant indexes for common existing records without changing legacy column definitions.
create index if not exists idx_patients_practice on public.patients(practice_id);
create index if not exists idx_visits_practice_created on public.visits(practice_id, created_at desc);
create index if not exists idx_billing_practice_created on public.billing(practice_id, created_at desc);

-- SECURITY DEFINER helper avoids recursive RLS when checking the staff_facility_roles table.
create or replace function public.hwms_user_has_facility_access(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.practice_id = target_practice_id
  )
  or exists (
    select 1 from public.practice_users pu
    where pu.user_id = auth.uid() and pu.practice_id = target_practice_id
  )
  or exists (
    select 1 from public.staff_facility_roles sfr
    where sfr.user_id = auth.uid()
      and sfr.practice_id = target_practice_id
      and sfr.is_active = true
  );
$$;

-- Enable RLS on new facility-owned tables. These policies enforce facility membership;
-- role-specific authorisation must be layered on before production use.
do $$
declare t text;
begin
  foreach t in array array[
    'departments','staff_facility_roles','appointments','wards','beds','admissions',
    'bed_movements','lab_orders','lab_specimens','lab_results','imaging_orders',
    'imaging_studies','imaging_reports','billing_items','billing_payments','billing_refunds'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists hwms_facility_select on public.%I', t);
    execute format('drop policy if exists hwms_facility_insert on public.%I', t);
    execute format('drop policy if exists hwms_facility_update on public.%I', t);
    execute format('drop policy if exists hwms_facility_delete on public.%I', t);
    execute format(
      'create policy hwms_facility_select on public.%I for select to authenticated using (public.hwms_user_has_facility_access(%I.practice_id))', t, t);
    execute format(
      'create policy hwms_facility_insert on public.%I for insert to authenticated with check (public.hwms_user_has_facility_access(%I.practice_id))', t, t);
    execute format(
      'create policy hwms_facility_update on public.%I for update to authenticated using (public.hwms_user_has_facility_access(%I.practice_id)) with check (public.hwms_user_has_facility_access(%I.practice_id))', t, t, t);
    execute format(
      'create policy hwms_facility_delete on public.%I for delete to authenticated using (public.hwms_user_has_facility_access(%I.practice_id))', t, t);
  end loop;
end $$;

alter table public.organisations enable row level security;
drop policy if exists hwms_org_select on public.organisations;
create policy hwms_org_select on public.organisations for select to authenticated
using (exists (
  select 1 from public.practices pr
  where pr.organisation_id = organisations.id
    and public.hwms_user_has_facility_access(pr.id)
));

commit;

-- IMPORTANT SECURITY FOLLOW-UP:
-- These policies provide facility isolation but are not a complete role/permission matrix.
-- Add role-specific restrictions (for example only authorised billing staff can post payments,
-- only laboratory staff can verify lab results, and only radiologists can finalise reports).
-- Existing permissive legacy policies on older tables may still allow broader access.
-- Review and test ALL deployed RLS policies before real patient data is used.
-- Payment writes should ultimately be performed by a SECURITY DEFINER RPC that validates
-- outstanding balance, idempotency, receipt numbering, audit logging and bill summary updates
-- inside one database transaction; direct client inserts are not sufficient for production.
