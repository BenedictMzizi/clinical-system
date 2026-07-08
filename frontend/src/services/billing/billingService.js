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

    let amount =
      medications.length * 10;

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
