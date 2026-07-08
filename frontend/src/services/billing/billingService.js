import { supabase } from "../../lib/supabase";

import {
  globalInsert,
  globalSelect,
  globalUpdate
} from "../../lib/globalDataLayer";

import { BillingStatus } from "../../constants/billingStatus";



/* ======================================================
   CURRENT USER
====================================================== */

export async function getCurrentUser() {

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error)
    throw error;

  if (!user)
    throw new Error("Not authenticated");

  return user;

}



/* ======================================================
   BILLING EXISTS
====================================================== */

export async function billingExists(
  prescriptionId
) {

  const billing =
    await globalSelect(
      "billing",
      query =>
        query
          .select("id")
          .eq(
            "prescription_id",
            prescriptionId
          )
          .limit(1)
    );

  return billing?.length > 0;

}



/* ======================================================
   GET BILL BY PRESCRIPTION
====================================================== */

export async function getBillingByPrescription(
  prescriptionId
) {

  const billing =
    await globalSelect(
      "billing",
      query =>
        query
          .select("*")
          .eq(
            "prescription_id",
            prescriptionId
          )
          .single()
    );

  return billing;

}



/* ======================================================
   GET BILL
====================================================== */

export async function getBilling(
  billingId
) {

  const billing =
    await globalSelect(
      "billing",
      query =>
        query
          .select("*")
          .eq("id", billingId)
          .single()
    );

  return billing;

}



/* ======================================================
   GET PATIENT BILLING
====================================================== */

export async function getPatientBilling(
  patientId
) {

  const billing =
    await globalSelect(
      "billing",
      query =>
        query
          .select("*")
          .eq(
            "patient_id",
            patientId
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
    );

  return billing || [];

}



/* ======================================================
   CALCULATE PHARMACY BILL
====================================================== */

export function calculateMedicationBill(
  prescription
) {

  try {

    const medications =
      typeof prescription.medications === "string"

        ? JSON.parse(
            prescription.medications
          )

        : prescription.medications || [];

    let const itemPrice =

    await getServicePrice(

        prescription.practice_id,

        "MEDICATION_ITEM"

    );

amount =

    medications.length *

    itemPrice;;

    if (
      prescription.patient?.insurance
    ) {

      amount = 0;

    }

    return amount;

  }

  catch {

    return 0;

  }

}



/* ======================================================
   CALCULATE CONSULTATION BILL
====================================================== */

export function calculateConsultationBill(
  consultationFee = 250
) {

  return Number(consultationFee);

}



/* ======================================================
   CALCULATE LAB BILL
====================================================== */

export function calculateLabBill(
  tests = []
) {

  if (!Array.isArray(tests))
    return 0;

  return tests.reduce(

    (total, test) =>

      total +
      Number(
        test.price || 0
      ),

    0

  );

}
/* ======================================================
   CREATE BILLING
====================================================== */

export async function createBilling({

  practiceId,

  prescriptionId = null,

  visitId = null,

  patientId,

  amount,

  status = BillingStatus.PENDING,

  description = "",

  createdBy

}) {

  const now = new Date().toISOString();

  return await globalInsert(

    "billing",

    {

      practice_id: practiceId,

      prescription_id: prescriptionId,

      visit_id: visitId,

      patient_id: patientId,

      amount,

      status,

      description,

      created_by: createdBy,

      created_at: now,

      updated_at: now

    }

  );

}



/* ======================================================
   UPDATE BILL AMOUNT
====================================================== */

export async function updateBillAmount(

  billingId,

  amount

) {

  return await globalUpdate(

    "billing",

    { id: billingId },

    {

      amount,

      updated_at: new Date().toISOString()

    }

  );

}



/* ======================================================
   MARK BILL PENDING
====================================================== */

export async function markPending(

  billingId

) {

  return await globalUpdate(

    "billing",

    { id: billingId },

    {

      status: BillingStatus.PENDING,

      updated_at: new Date().toISOString()

    }

  );

}



/* ======================================================
   MARK BILL PAID
====================================================== */

export async function markPaid(

  billingId,

  paidBy,

  paymentMethod = "Cash",

  reference = null

) {

  const now = new Date().toISOString();

  return await globalUpdate(

    "billing",

    { id: billingId },

    {

      status: BillingStatus.PAID,

      payment_method: paymentMethod,

      payment_reference: reference,

      paid_by: paidBy,

      paid_at: now,

      updated_at: now

    }

  );

}



/* ======================================================
   CANCEL BILL
====================================================== */

export async function cancelBill(

  billingId,

  reason = ""

) {

  return await globalUpdate(

    "billing",

    { id: billingId },

    {

      status: BillingStatus.CANCELLED,

      cancellation_reason: reason,

      cancelled_at: new Date().toISOString(),

      updated_at: new Date().toISOString()

    }

  );

}



/* ======================================================
   REFUND BILL
====================================================== */

export async function refundBill(

  billingId,

  refundedBy,

  reason = ""

) {

  return await globalUpdate(

    "billing",

    { id: billingId },

    {

      status: BillingStatus.REFUNDED,

      refunded_by: refundedBy,

      refund_reason: reason,

      refunded_at: new Date().toISOString(),

      updated_at: new Date().toISOString()

    }

  );

    }
/* ======================================================
   GET ALL BILLS FOR A PRACTICE
====================================================== */

export async function getBillsByPractice(
  practiceId
) {

  const bills =
    await globalSelect(
      "billing",
      query =>
        query
          .select(`
            *,
            patient:patients(
              id,
              full_name,
              id_number
            )
          `)
          .eq(
            "practice_id",
            practiceId
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
    );

  return bills || [];

}



/* ======================================================
   GET OUTSTANDING BILLS
====================================================== */

export async function getOutstandingBills(
  practiceId
) {

  const bills =
    await globalSelect(
      "billing",
      query =>
        query
          .select(`
            *,
            patient:patients(
              id,
              full_name
            )
          `)
          .eq(
            "practice_id",
            practiceId
          )
          .eq(
            "status",
            BillingStatus.PENDING
          )
    );

  return bills || [];

}



/* ======================================================
   GET PAID BILLS
====================================================== */

export async function getPaidBills(
  practiceId
) {

  const bills =
    await globalSelect(
      "billing",
      query =>
        query
          .select(`
            *,
            patient:patients(
              id,
              full_name
            )
          `)
          .eq(
            "practice_id",
            practiceId
          )
          .eq(
            "status",
            BillingStatus.PAID
          )
          .order(
            "paid_at",
            {
              ascending: false
            }
          )
    );

  return bills || [];

}



/* ======================================================
   GET BILLS BY DATE RANGE
====================================================== */

export async function getBillsByDateRange(

  practiceId,

  startDate,

  endDate

) {

  const bills =
    await globalSelect(
      "billing",
      query =>
        query
          .select("*")
          .eq(
            "practice_id",
            practiceId
          )
          .gte(
            "created_at",
            startDate
          )
          .lte(
            "created_at",
            endDate
          )
    );

  return bills || [];

}



/* ======================================================
   BILLING SUMMARY
====================================================== */

export function getBillingSummary(
  bills = []
) {

  const summary = {

    totalBills: bills.length,

    pendingBills: 0,

    paidBills: 0,

    cancelledBills: 0,

    refundedBills: 0,

    totalRevenue: 0,

    outstandingAmount: 0

  };



  bills.forEach(bill => {

    const amount =
      Number(bill.amount || 0);

    switch (bill.status) {

      case BillingStatus.PAID:

        summary.paidBills++;

        summary.totalRevenue += amount;

        break;

      case BillingStatus.PENDING:

        summary.pendingBills++;

        summary.outstandingAmount += amount;

        break;

      case BillingStatus.CANCELLED:

        summary.cancelledBills++;

        break;

      case BillingStatus.REFUNDED:

        summary.refundedBills++;

        break;

      default:

        break;

    }

  });

  return summary;

}



/* ======================================================
   DELETE BILL (ADMIN ONLY)
====================================================== */

export async function deleteBill(
  billingId
) {

  const { error } =
    await supabase
      .from("billing")
      .delete()
      .eq("id", billingId);

  if (error)
    throw error;

}



/* ======================================================
   VALIDATE BILL
====================================================== */

export function validateBilling({

  patientId,

  amount

}) {

  if (!patientId)
    throw new Error(
      "Patient is required."
    );

  if (
    amount === undefined ||
    amount === null
  )
    throw new Error(
      "Amount is required."
    );

  if (Number(amount) < 0)
    throw new Error(
      "Amount cannot be negative."
    );

  return true;

            }
