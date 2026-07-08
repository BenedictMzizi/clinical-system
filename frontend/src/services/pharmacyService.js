import { supabase } from "../lib/supabase";
import { VisitStatus } from "../constants/visitStatus";
import { PrescriptionStatus } from "../constants/prescriptionStatus";
import { BillingStatus } from "../constants/billingStatus";


import {
  globalInsert,
  global Update, 
  globalSelect
} from "../lib/globalDataLayer";


export async function loadProfile() {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError)
    throw userError;

  if (!user)
    throw new Error("Not authenticated");

  const profile =
    await globalSelect(
      "profiles",
      query =>
        query
          .select("*")
          .eq("id", user.id)
          .single()
    );

  if (!profile)
    throw new Error("Profile not found");

  return profile;

}

export async function getPendingPrescriptions(practiceId) {

  const { data, error } =
    await supabase
      .from("prescriptions")
      .select(`
        id,
        practice_id,
        visit_id,
        patient_id,
        medications,
        pharmacist_note,
        status,
        locked,
        created_at,
        patient:patients(
          id,
          full_name,
          id_number,
          insurance
        )
      `)
      .eq("practice_id", practiceId)
      .eq(
        "status",
        PrescriptionStatus.PENDING
      )
      .eq("locked", false)
      .order(
        "created_at",
        { ascending: true }
      );

  if (error)
    throw error;

  return data || [];

}

export async function getReadyPrescriptions(practiceId) {

  const { data, error } =
    await supabase
      .from("prescriptions")
      .select(`
        *,
        patient:patients(*)
      `)
      .eq("practice_id", practiceId)
      .eq(
        "status",
        PrescriptionStatus.READY_FOR_COLLECTION
      )
      .order(
        "prepared_at",
        { ascending: true }
      );

  if (error)
    throw error;

  return data || [];

}

export async function billingExists(prescriptionId) {

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

export function calculateBilling(prescription) {

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
      prescription.patient?.insurance === true
    ) {

      amount = 0;

    }

    return amount;

  } catch {

    return 0;

  }

}

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

async function createBilling(
  prescription,
  profile,
  user
) {

  const amount =
    calculateBilling(prescription);

  await globalInsert(
    "billing",
    {
      practice_id: profile.practice_id,

      prescription_id: prescription.id,

      visit_id: prescription.visit_id,

      patient_id: prescription.patient_id,

      amount,

      status:
        amount > 0
          ? BillingStatus.PENDING
          : BillingStatus.PAIDCONSULTATION,

      created_by: user.id,

      created_at:
        new Date().toISOString()

    }
  );

}




async function markPrescriptionPrepared(
  prescriptionId,
  userId
) {

  const now =
    new Date().toISOString();

  await globalUpdate(

    "prescriptions",

    { id: prescriptionId },

    {

      status:
        PrescriptionStatus.READY_FOR_COLLECTION,

      locked: true,

      prepared_by: userId,

      prepared_at: now,

      updated_by: userId,

      updated_at: now

    }

  );

}


async function createAuditLog({

  practiceId,

  actorId,

  action,

  entity,

  entityId

}) {

  await globalInsert(

    "audit_logs",

    {

      practice_id: practiceId,

      actor_id: actorId,

      action,

      entity,

      entity_id: entityId,

      created_at:
        new Date().toISOString()

    }

  );

}


export async function prepareMedicationService(

  prescription,

  profile

) {

  const user =
    await getCurrentUser();



  if (prescription.locked)

    throw new Error(
      "Prescription already locked."
    );



  const exists =
    await billingExists(
      prescription.id
    );

  if (exists)

    throw new Error(
      "Billing already exists."
    );



  await createBilling(

    prescription,

    profile,

    user

  );


  await markPrescriptionPrepared(

    prescription.id,

    user.id

  );



  await createAuditLog({

    practiceId:
      profile.practice_id,

    actorId:
      user.id,

    action:
      "MEDICATION_PREPARED",

    entity:
      "prescription",

    entityId:
      prescription.id

  });

}


async function markPrescriptionDispensed(
  prescriptionId,
  userId
) {

  const now = new Date().toISOString();

  await globalUpdate(
    "prescriptions",
    { id: prescriptionId },
    {
      status: PrescriptionStatus.DISPENSED,
      dispensed_by: userId,
      dispensed_at: now,
      updated_by: userId,
      updated_at: now
    }
  );

}




async function closeVisit(
  visitId
) {

  await globalUpdate(
    "visits",
    { id: visitId },
    {
      status: VisitStatus.CLOSED,
      updated_at: new Date().toISOString()
    }
  );

}





export async function confirmCollectionService(

  prescription,

  profile

) {

  const user =
    await getCurrentUser();



  await markPrescriptionDispensed(

    prescription.id,

    user.id

  );



  await createAuditLog({

    practiceId:
      profile.practice_id,

    actorId:
      user.id,

    action:
      "MEDICATION_COLLECTED",

    entity:
      "prescription",

    entityId:
      prescription.id

  });



  await closeVisit(

    prescription.visit_id

  );

}



export function parseMedications(
  medications
) {

  if (!medications)
    return [];

  if (Array.isArray(medications))
    return medications;

  try {

    return JSON.parse(medications);

  } catch {

    return [];

  }

}




export function formatMedications(
  medications
) {

  const meds =
    parseMedications(
      medications
    );

  return meds
    .map(m =>
      `${m.name || ""} ${m.dosage || ""} ${m.frequency || ""}`.trim()
    )
    .join(", ");

}




export function medicationCount(
  medications
) {

  return parseMedications(
    medications
  ).length;

      }
