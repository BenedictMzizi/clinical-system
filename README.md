# Hospital Workflow Management System (HWMS)

<p align="center">
  <strong>A Full-Stack Healthcare Workflow Management Platform</strong>
</p>

<p align="center">
  Digitising clinical operations, patient records and healthcare administration.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Authentication-JWT-00599C" alt="JWT Authentication">
  <img src="https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel" alt="Vercel">
</p>

---

## Overview

The **Hospital Workflow Management System (HWMS)** is a full-stack healthcare workflow platform designed to streamline clinical operations by digitising the patient lifecycle, from registration and triage through consultation, billing and medication dispensing.

The platform brings multiple healthcare departments into one integrated system, providing structured workflows for receptionists, nurses, doctors, pharmacists, billing personnel and administrators.

HWMS is designed to support both clinics and hospitals, with a multi-facility architecture that enables healthcare organisations to manage their own staff, patients and operational records.

### Objectives

- Reduce patient waiting times through streamlined workflows.
- Improve staff accountability and operational visibility.
- Minimise lost, duplicated and fragmented patient records.
- Centralise patient medical histories.
- Improve medication control and inventory management.
- Strengthen healthcare data security.
- Support informed clinical decision-making.
- Improve coordination between healthcare departments.

## Business Impact

Traditional healthcare facilities often depend on paper-based records and disconnected administrative processes.

HWMS addresses these challenges through:

- **Digital patient records:** Centralised patient information and medical history.
- **Workflow automation:** Structured patient movement between departments.
- **Operational accountability:** Role-specific access and traceable staff actions.
- **Medication traceability:** Prescription and dispensing accountability.
- **Reduced duplication:** Controlled prescription and medication workflows.
- **Improved visibility:** Centralised operational information for authorised staff.
- **Facility separation:** Practice-level data isolation for multi-facility deployments.

## Key Features

### Reception and Patient Management

- Patient registration and demographic management.
- Patient search and record retrieval.
- Visit creation and patient arrival workflows.
- Appointment management.
- Reception dashboard and patient queue visibility.

### Nursing and Triage

- Vital signs capture.
- Patient triage.
- Clinical observations.
- Patient workflow handover to consultation.

### Doctor Consultation

- Doctor dashboard and consultation queue.
- Patient medical history review.
- Clinical consultation documentation.
- Diagnosis recording.
- Prescription generation.
- Structured consultation workflows.

### Billing and Payments

- Patient billing management.
- Payment processing.
- Outstanding balance tracking.
- Payment records and transaction accountability.

### Pharmacy

- Prescription queue management.
- Medication dispensing.
- Medication inventory monitoring.
- Dispensing history.
- Prescription and dispensing accountability.

### Wards and Admissions

- Ward and bed management.
- Patient admissions.
- Bed allocation and transfers.
- Discharge workflows.
- Bed occupancy visibility.

### Diagnostics and Laboratory

- Diagnostic workflow support.
- Digital diagnostic records.
- Laboratory workflow support.

### Administration

- User and staff management.
- Role-based permissions.
- Practice and facility management.
- Operational oversight.
- Reporting and administrative controls.

## Patient Workflow Architecture

HWMS connects the major stages of patient care through an integrated workflow.

```text
              PATIENT ARRIVAL
                    |
                    v
          RECEPTION & REGISTRATION
                    |
                    v
              VITALS CAPTURE
                    |
                    v
            DOCTOR CONSULTATION
                    |
                    v
          DIAGNOSIS & PRESCRIPTION
                    |
             +------+------+
             |             |
             v             v
          BILLING       DIAGNOSTICS
             |
             v
       PHARMACY DISPENSING
             |
             v
       COMPLETED PATIENT VISIT
```

Additional workflows support appointments, admissions, wards, beds, laboratory services and patient transfers.

## Security and Access Control

Security is a core consideration in the HWMS architecture.

### Authentication
- JWT-based authentication using Supabase Auth.
- Authenticated application sessions.
- Protected application routes.

### Authorization
- Role-Based Access Control (RBAC).
- Department-specific permissions.
- Protected administrative functions.
- Role-scoped operational workflows.

### Data Protection
- PostgreSQL Row-Level Security (RLS).
- Practice-level data isolation.
- Controlled access to patient and operational records.

### Auditability
- User action tracking.
- Prescription accountability.
- Medication dispensing accountability.
- Payment transaction traceability.

### Cybersecurity Considerations
- Least-privilege access principles.
- Session validation.
- Secure data access controls.
- Separation of administrative and clinical permissions.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend Platform | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Role-Based Access Control |
| Data Security | PostgreSQL Row-Level Security |
| Hosting | Vercel |
| Version Control | Git and GitHub |

## Application Screenshots

The following screenshots demonstrate the current HWMS interface and its integrated departmental workflows.

### 1. Reception Dashboard

<img width="100%" src="https://github.com/user-attachments/assets/0b2bf468-a2b8-4a40-b8db-69d49641fee4" alt="HWMS Reception Dashboard">

### 2. Patient Registration and Management

<img width="100%" src="https://github.com/user-attachments/assets/06968678-b4b0-4a1c-8cf7-febdc016e1d7" alt="HWMS Patient Registration">

### 3. Nursing and Vitals Workflow

<img width="100%" src="https://github.com/user-attachments/assets/defbf928-0633-4ced-b863-639116bcfa46" alt="HWMS Nursing and Vitals Workflow">

### 4. Reception 

<img width="100%" src="https://github.com/user-attachments/assets/da6d4acf-72cf-4cc5-947d-2b2f2676d97e" alt="HWMS Doctor Consultation">

### 5. login

<img width="100%" src="https://github.com/user-attachments/assets/e2ff8f10-d33e-44e2-a9e0-98d116904c6e" alt="HWMS Pharmacy Management">

## Live Demo

**Application:** https://clinical-system-orpin.vercel.app

### Demo Accounts

| Role | Username |
|---|---|
| Receptionist | reception@test.com |
| Nurse | nurse@test.com |
| Consultant | doctor@test.com |
| Pharmacist | pharmacy@test.com |

**Demo password:** `password`

Administrative accounts are intentionally not exposed.

> The demo uses test accounts and should not be used to enter real patient information or sensitive medical data.

## Testing and Validation

Testing activities have included:

- Functional testing.
- Integration testing.
- Patient workflow validation.
- Role-based access control testing.
- User acceptance testing.
- Security and access validation.

## Future Enhancements

Planned areas of further development include:

- Expanded appointment scheduling.
- SMS and email notifications.
- Enhanced multi-clinic and multi-hospital management.
- Advanced reporting and analytics.
- AI-assisted clinical decision-support capabilities.
- Expanded diagnostic and laboratory integrations.
- Further automation of administrative workflows.

## Author

**Benedict de Almeida Mzizi**

Software Engineer | Cloud | DevOps | Automation

- **GitHub:** https://github.com/BenedictMzizi
- **LinkedIn:** https://www.linkedin.com/in/benedict-mzizi

---

<p align="center">
  <strong>Hospital Workflow Management System</strong>
  <br>
  Connecting healthcare workflows through technology.
</p>
