import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import { PrescriptionStatus } from "../constants/prescriptionStatus";
import { BillingStatus } from "../constants/billingStatus";
import { VisitStatus } from "../constants/visitStatus";


import {
  globalUpdate,
  globalInsert,
  globalSelect
} from "../lib/globalDataLayer";

import {
  container,
  header,
  card,
  buttonPrimary,
  messageError,
  messageInfo
} from "../styles/styles";


export default function Pharmacy() {


  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [dispensingId, setDispensingId] = useState(null);

  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);

  const visitId = prescription.visit_id;



  async function loadProfile() {

    try {

      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const profileData =
        await globalSelect(
          "profiles",
          query =>
            query
              .select("*")
              .eq("id", user.id)
              .single()
        );

      setProfile(profileData);

    }
    catch (err) {

      console.error(err);
      setError("Failed to load profile");

    }

  }



  function formatMedications(medications) {

    if (!medications) return "N/A";

    let meds = medications;

    if (typeof meds === "string") {
      try {
        meds = JSON.parse(meds);
      }
      catch {
        return meds;
      }
    }

    if (Array.isArray(meds)) {

      return meds.map(m =>
        `${m.name || ""} ${m.dosage || ""} ${m.frequency || ""}`.trim()
      ).join(", ");

    }

    return "N/A";

  }



  function calculateBilling(prescription) {

    try {

      const meds =
        typeof prescription.medications === "string"
          ? JSON.parse(prescription.medications)
          : prescription.medications || [];

      let total = meds.length * 10;

      if (prescription.patient?.insurance === true)
        total = 0;

      return total;

    }
    catch {

      return 0;

    }

  }



  async function loadPrescriptions() {

    setLoading(true);
    setError(null);

    try {

      if (!profile?.practice_id) return;

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
          .eq("practice_id", profile.practice_id)
          .eq("status", PrescriptionStatus.PENDING)
          .eq("locked", false)
          .order("created_at", { ascending: true });

      if (error) throw error;

      setPrescriptions(data || []);

    }
    catch (err) {

      console.error(err);
      setError("Failed to load prescriptions");

    }

    setLoading(false);

  }



  async function billingExists(prescriptionId) {

    const existing =
      await globalSelect(
        "billing",
        query =>
          query
            .select("id")
            .eq("prescription_id", prescriptionId)
            .limit(1)
      );

    return existing?.length > 0;

  }



  async function dispense(prescription) {

    if (dispensingId) return;

    setDispensingId(prescription.id);
    setError(null);

    try {


      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user)
        throw new Error("Not authenticated");


      if (prescription.locked)
        throw new Error("Prescription locked");


      const exists =
        await billingExists(prescription.id);

      if (exists)
        throw new Error("Billing already exists");


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
          created_at: new Date().toISOString()
        }
      );


      await globalUpdate(
        "prescriptions",
        { id: prescription.id },
        {
          status: PrescriptionStatus.DISPENSED,

          locked: true,

          dispensed_by: user.id,

          dispensed_at: new Date().toISOString(),

          updated_by: user.id
        }
      );


             await globalInsert(
              "audit_logs",
              {
                practice_id: profile.practice_id,
                actor_id: user.id,
                action: "PRESCRIPTION_DISPENSED",
                entity: "prescription",
                entity_id: prescription.id,
                created_at: new Date().toISOString()
                }
              );
      
            await globalUpdate(
              "visits",
              { id: visitId },
              {
                status: VisitStatus.CLOSED,
                updated_at: new Date().toISOString()
              }
            );



      await loadPrescriptions();

    }
    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Dispense failed"
      );

    }

    setDispensingId(null);

  }


  useEffect(() => {

    loadProfile();

  }, []);


  useEffect(() => {

    if (profile)
      loadPrescriptions();

  }, [profile]);



  useEffect(() => {

    if (!profile) return;

    const interval =
      setInterval(
        loadPrescriptions,
        5000
      );

    return () =>
      clearInterval(interval);

  }, [profile]);



  if (loading)
    return (
      <div style={container}>
        <h1 style={header}>Pharmacy Queue</h1>
        <div style={messageInfo}>Loading...</div>
      </div>
    );



  return (

    <div style={container}>

      <h1 style={header}>
        Pharmacy Queue
      </h1>

      {error &&
        <div style={messageError}>
          {error}
        </div>
      }

      {prescriptions.length === 0 &&

        <div style={messageInfo}>
          No prescriptions pending
        </div>

      }

      {prescriptions.map(p => (

        <div
          key={p.id}
          style={{
            ...card,

            border:
              dispensingId === p.id
                ? "2px solid green"
                : undefined
          }}
        >

          <div>

            <strong>
              {p.patient?.full_name}
            </strong>

            {" "}
            {p.patient?.id_number}

          </div>

          <div>
            Medications:
            {" "}
            {formatMedications(p.medications)}
          </div>

          <div>
            Created:
            {" "}
            {new Date(
              p.created_at
            ).toLocaleString()}
          </div>

          <button
            style={{
              ...buttonPrimary,
              marginTop: 10
            }}
            onClick={() => dispense(p)}
            disabled={
              dispensingId === p.id
            }
          >

            {dispensingId === p.id
              ? "Dispensing..."
              : "Dispense"}

          </button>

        </div>

      ))}

    </div>

  );

}
