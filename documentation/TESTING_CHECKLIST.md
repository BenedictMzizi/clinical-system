#  Hospital Management System (HWMS)
## System Testing Checklist

Version: 1.0
Environment: Development / Production
Database: Supabase
Frontend: React
Backend: Supabase API
Author: Benedict De Almeida Mzizi

---

# Test Summary

| Module | Status |
|----------------|---------|
| Authentication | ☐ |
| User Management | ☐ |
| Reception | ☐ |
| Patient Registration | ☐ |
| Patient Search | ☐ |
| Doctor Queue | ☐ |
| Consultation | ☐ |
| Prescription | ☐ |
| Pharmacy | ☐ |
| Billing | ☐ |
| Audit Logs | ☐ |
| Dashboard | ☐ |
| Security | ☐ |

---

# 1 Authentication

## Login

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Login with valid credentials | Redirect to dashboard | ☐ |
| Invalid email | Error displayed | ☐ |
| Invalid password | Error displayed | ☐ |
| Empty fields | Validation shown | ☐ |
| Session persists after refresh | User remains logged in | ☐ |

---

## Logout

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Logout button | Session destroyed | ☐ |
| Back button after logout | Cannot access dashboard | ☐ |

---

# 2 User Management

## Admin

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Create user | User created | ☐ |
| Edit user | Details updated | ☐ |
| Disable user | User cannot login | ☐ |
| Assign role | Correct permissions | ☐ |

---

# 3 Reception Module

## Patient Registration

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Register patient | Patient saved | ☐ |
| Required fields validation | Error displayed | ☐ |
| Duplicate ID Number | Prevent duplicate | ☐ |
| Insurance selection | Saved correctly | ☐ |

---

## Patient Search

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Search by name | Patient displayed | ☐ |
| Search by ID | Patient displayed | ☐ |
| No results | Message shown | ☐ |

---

## Visit Creation

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Create visit | Visit created | ☐ |
| Queue updated | Doctor queue updated | ☐ |

---

# 4 Doctor Module

## Queue

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| View waiting patients | Queue displayed | ☐ |
| Refresh queue | Latest patients loaded | ☐ |

---

## Consultation

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Save consultation | Saved successfully | ☐ |
| Required diagnosis | Validation works | ☐ |
| Notes saved | Notes persist | ☐ |

---

## Prescription

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Add medication | Medication added | ☐ |
| Multiple medications | Saved correctly | ☐ |
| Save prescription | Prescription created | ☐ |
| Status = Pending | Correct status | ☐ |

---

# 5 Pharmacy Module

## Pharmacy Queue

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Pending prescriptions displayed | Yes | ☐ |
| Search by patient name | Works | ☐ |
| Search by ID number | Works | ☐ |
| Medication count correct | Matches prescription | ☐ |

---

## Prepare Medication

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Prepare medication | Status changes | ☐ |
| Billing created | Billing record exists | ☐ |
| Prescription locked | Cannot prepare twice | ☐ |
| Audit log created | Record exists | ☐ |



## Ready For Collection

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Ready prescriptions displayed | Yes | ☐ |
| Medication list shown | Yes | ☐ |
| Hand to patient | Status updated | ☐ |
| Visit closed | Status Closed | ☐ |
| Audit log created | Yes | ☐ |


# 6 Billing Module

## Billing Queue

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Pending invoices displayed | Yes | ☐ |
| Paid consultation displayed | Yes | ☐ |
| Insurance patient amount = 0 | Yes | ☐ |



## Payment

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Cash payment | Success | ☐ |
| Card payment | Success | ☐ |
| Receipt generated | Yes | ☐ |
| Status changes to Paid | Yes | ☐ |



# 7 Audit Logs

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Login logged | Yes | ☐ |
| Patient registration logged | Yes | ☐ |
| Consultation logged | Yes | ☐ |
| Medication prepared logged | Yes | ☐ |
| Medication dispensed logged | Yes | ☐ |
| Payment logged | Yes | ☐ |



# 8 Dashboard

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Patient count | Correct | ☐ |
| Today's visits | Correct | ☐ |
| Pending prescriptions | Correct | ☐ |
| Pending billing | Correct | ☐ |



# 9 Security Testing

## Authentication

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Unauthorized page access | Redirect to login | ☐ |
| Protected routes | Accessible by role only | ☐ |
| Expired session | Forced logout | ☐ |



## Authorization

| Role | Reception | Doctor | Pharmacy | Billing | Admin |
|----------------|------|------|------|------|------|
| Receptionist | ✅ | ❌ | ❌ | ❌ | ❌ |
| Doctor | Read | ✅ | Read | ❌ | ❌ |
| Pharmacist | Read | Read | ✅ | ❌ | ❌ |
| Cashier | Read | ❌ | Read | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

# 10 Database Integrity

| Test | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Foreign keys valid | Yes | ☐ |
| No duplicate billing | Yes | ☐ |
| One prescription not dispensed twice | Yes | ☐ |
| Visit closes after collection | Yes | ☐ |
| Audit logs immutable | Yes | ☐ |

---

# 11 Performance Testing

| Test | Target | Pass |
|-------------------------------|-----------------------------|------|
| Login | < 2 sec | ☐ |
| Patient search | < 1 sec | ☐ |
| Prescription load | < 2 sec | ☐ |
| Billing load | < 2 sec | ☐ |
| Dashboard load | < 3 sec | ☐ |

---

# 12 End-to-End Workflow

## Complete Patient Journey

| Step | Expected | Pass |
|-------------------------------|-----------------------------|------|
| Register patient | Success | ☐ |
| Create visit | Success | ☐ |
| Doctor consultation | Success | ☐ |
| Prescription created | Success | ☐ |
| Pharmacy prepares medication | Success | ☐ |
| Billing generated | Success | ☐ |
| Payment completed | Success | ☐ |
| Medication collected | Success | ☐ |
| Visit closed | Success | ☐ |
| Audit logs generated | Success | ☐ |

---

# Overall Test Result

| Item | Result |
|----------------|---------|
| Total Tests | ______ |
| Passed | ______ |
| Failed | ______ |
| Pass Rate | ______ % |

---

## Tester

Name: Benedict de Almeida Mzizi

______________________________________________________

______________________________________________________

______________________________________________________
