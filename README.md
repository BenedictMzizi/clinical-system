Hospital Workflow Management System (HWMS)

Overview

HWMS is a full-stack healthcare workflow platform designed to streamline clinical operations by digitizing the complete patient lifecycle from registration to medication dispensing.

The system was designed to:

Reduce patient waiting times
Improve staff accountability and performance tracking
Prevent lost patient records
Centralize patient medical history
Improve medication control and inventory management
Strengthen healthcare data security
Support informed clinical decision-making
Business Impact

Traditional clinics often rely on paper records and fragmented workflows.

HWMS addresses these challenges by:

Digitizing patient records
Reducing administrative workload
Providing role-based workflows
Improving medication traceability
Preventing duplicate medication requests
Improving operational visibility

Key Features
Reception
Patient registration
Visit creation
Patient search

Demographic management
Nursing
Vital signs capture
Patient triage
Consultation
Medical history review
Diagnosis recording
Prescription generation
Billing
Payment processing
Outstanding balance tracking
Pharmacy
Medication dispensing
Inventory monitoring
Dispensing history
Administration
User management
Practice management
Reporting and oversight

Security Features
Authentication
JWT-based authentication using Supabase Auth
Authorization
Role-Based Access Control (RBAC)
Data Protection
Row-Level Security (RLS)
Practice-level data isolation
Auditability
User action tracking
Prescription accountability
Dispensing accountability
Cybersecurity Considerations
Least Privilege Access
Protected Administrative Functions
Session Validation
Secure Data Access Controls

Technology Stack
Layer	Technology
Frontend	React
Backend	Supabase
Database	PostgreSQL
Authentication	Supabase Auth
Hosting	Vercel
Version Control	GitHub


Architecture

Patient Registration
↓
Vitals Capture
↓
Doctor Consultation
↓
Prescription
↓
Billing
↓
Pharmacy Dispensing


Screenshots
Login Screen
<img width="1363" height="603" alt="logIn" src="https://github.com/user-attachments/assets/86c5183a-a8ef-4260-92e6-758c5bd61bbb" />

Reception Dashboard
<img width="1366" height="683" alt="reception" src="https://github.com/user-attachments/assets/3788c000-cbd4-434b-8518-59c02f3261c9" />

Patient Regestration
<img width="1366" height="694" alt="preg" src="https://github.com/user-attachments/assets/4611a6d3-abec-4e60-beec-30919366d365" />

Vitals Flow
<img width="1366" height="688" alt="nurse" src="https://github.com/user-attachments/assets/f4412000-c6bc-4974-ad84-ccb449685ae9" />

Doctors Dashboard
<img width="1365" height="638" alt="doctorCue" src="https://github.com/user-attachments/assets/06749bcf-9c89-41ed-89a0-7c2ba327bc27" />

Consultation Workflow
<img width="1363" height="642" alt="doctorConsultation" src="https://github.com/user-attachments/assets/c96681e1-a927-4678-969b-504f5aa284a2" />

Pharmacy Dashboard
<img width="1361" height="606" alt="pharmacyQueue" src="https://github.com/user-attachments/assets/b849cb13-b443-4ab0-8776-03bf912e68fb" />

Live Demo

Demo URL: https://clinical-system-orpin.vercel.app

Demo Accounts
Role	Username
Receptionist	reception@test.com
Nurse	nurse@test.com
Consultant	doctor@test.com
Pharmacist	pharmacy@test.com

Password for all demo accounts:

password

Administrative accounts are intentionally not exposed.

Testing

Testing performed:

Functional Testing
Integration Testing
Workflow Validation
Access Control Testing
User Acceptance Testing
Security Validation
Future Enhancements
Appointment Scheduling
SMS Notifications
Email Notifications
Multi-Clinic Support
AI-Assisted Decision Support
Advanced Analytics Dashboard



Benedict de Almeida Mzizi

Software Engineer | Cloud | DevOps | Automation

GitHub: https://github.com/BenedictMzizi

LinkedIn: https://www.linkedin.com/in/benedict-mzizi
