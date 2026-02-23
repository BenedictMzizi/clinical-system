# Electronic Clinical Workflow Management System

All users (Admin, Receptionist, Consultant, Pharmacist) authenticate via Supabase Auth.
Every action is logged for audit purposes.

## Deployment
- Frontend: React (Vercel)
- Backend: Supabase (PostgreSQL, Auth, RLS, Storage)

## Roles
- Admin: Sytem auditor
- Receptionist: Search, update contact, create visits
- Consultant: Exclusive consultation, SOAP, prescriptions
- Pharmacist: Dispense meds, add substitution notes
