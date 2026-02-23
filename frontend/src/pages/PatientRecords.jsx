import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams } from "react-router-dom";

export default function PatientRecords() {

  const { patientId } = useParams();

  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {

    const { data, error } = await supabase
      .from("consultations")
      .select(`
        *,
        visits (
          created_at
        ),
        profiles (
          email
        )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (!error)
      setConsultations(data);
  }

  return (
    <div>

      <h2>Patient Consultation History</h2>

      {consultations.map(c => (

        <div key={c.id} className="card">

          <p>Date: {new Date(c.created_at).toLocaleString()}</p>

          <p>Doctor: {c.profiles?.email}</p>

          <p>Diagnosis: {c.diagnosis}</p>

          <p>Notes: {c.notes}</p>

        </div>

      ))}

    </div>
  );
}
