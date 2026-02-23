import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import {
  globalUpdate,
  globalInsert
} from "../lib/globalDataLayer";

import { RealtimeEngine } from "../lib/realtimeEngine";

import { VisitStatus } from "../constants/visitStatus";
import { PrescriptionStatus } from "../constants/prescriptionStatus";

import {
  container,
  header,
  card,
  input,
  textarea,
  buttonPrimary,
  messageSuccess,
  messageError
} from "../styles/styles";


export default function Consultant() {

  const { visitId } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
   
  const [pharmacy_note, setPharmacy_Note] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  const [vitals, setVitals] = useState(null);

  const [medications, setMedications] = useState([
    { name: "", dosage: "", frequency: "" }
  ]);

  const [currentDoctorId, setCurrentDoctorId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);


  useEffect(() => {
    initializeConsultation();
  }, [visitId]);


  useEffect(() => {

    function handleUpdate(data) {
      if (data.id === visitId) {
        setVisit(prev => ({ ...prev, ...data }));
      }
    }

    RealtimeEngine.on("visits", handleUpdate);
    return () => RealtimeEngine.off("visits", handleUpdate);

  }, [visitId]);


  async function initializeConsultation() {

    setLoading(true);

    try {

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/login");
        return;
      }

      setCurrentDoctorId(user.id);

      const { data, error: visitError } =
        await supabase
          .from("visits")
          .select(`*, patient:patients(*)`)
          .eq("id", visitId)
          .single();

      if (visitError || !data) {
        setError("Visit not found");
        setLoading(false);
        return;
      }

      if (data.doctor_id && data.doctor_id !== user.id) {

        setError(
          "This consultation is assigned to another doctor"
        );

        setTimeout(() => navigate("/consultant"), 2000);
        setLoading(false);
        return;
      }

      if (!data.doctor_id) {

        await globalUpdate(
          "visits",
          { id: visitId },
          {
            doctor_id: user.id,
            status: VisitStatus.OPEN,
            updated_at: new Date().toISOString()
          }
        );

        data.doctor_id = user.id;
      }

      const { data: consultationHistory } =
        await supabase
          .from("consultations")
          .select("*")
          .eq("visit_id", visitId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (consultationHistory) {
           setSymptoms(consultationHistory.subjective || "");
           setNotes(consultationHistory.objective || "");
           setDiagnosis(consultationHistory.assessment || "");
           setPharmacy_Note(consultationHistory.pharmacy_note || "");
           }

      // Load vitals
      const { data: vitalsData } =
        await supabase
          .from("vitals")
          .select("*")
          .eq("visit_id", visitId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      setVitals(vitalsData);
      setVisit(data);

    }
    catch (err) {
      console.error(err);
      setError("Failed to load consultation");
    }

    setLoading(false);
  }



  function addMedication() {
    setMedications([
      ...medications,
      { name: "", dosage: "", frequency: "" }
    ]);
  }

  function updateMedication(index, field, value) {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  }



  async function saveConsultation() {

    if (saving) return; 

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {

      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user)
        throw new Error("Not authenticated");

      if (!visit?.practice_id)
        throw new Error("Visit missing practice_id");

      if (!visit?.patient?.id)
        throw new Error("Invalid patient reference");


      await globalUpdate(
        "visits",
        { id: visitId },
        {
          notes,
          diagnosis,
          doctor_id: user.id,
          updated_at: new Date().toISOString()
        }
      );


      await globalInsert(
        "consultations",
        {
            visit_id: visitId,
            subjective: symptoms?.trim() || null,
            objective: notes?.trim() || null,
            assessment: diagnosis|| null,
            pharmacy_note: pharmacy_note?.trim() || null,
            practice_id: visit.practice_id,
            //doctor_id: user.id,
            created_at: new Date().toISOString(),
            created_by: user.id
        }
      );


      const validMedications =
        medications.filter(m =>
          m.name?.trim() &&
          m.dosage?.trim() &&
          m.frequency?.trim()
        );

      const { data: existing } =
        await supabase
          .from("prescriptions")
          .select("id")
          .eq("visit_id", visitId)
          .limit(1);

      if (existing?.length)
        throw new Error("Prescription already exists");

    

if (!user?.id) {
  throw new Error("User not authenticated");
}

if (!visitId) {
  throw new Error("Visit ID missing");
}

if (!visit?.patient?.id) {
  throw new Error("Patient ID missing from visit");
}

if (!visit?.practice_id) {
  throw new Error("Practice ID missing from visit");
}


const dosageSummary = validMedications.length
  ? validMedications
      .map(m => `${m.name} ${m.dosage} ${m.frequency}`)
      .join(", ")
  : null;



const prescriptionNumber =
  `RX-${visitId}-${Date.now()}`;

const now = new Date().toISOString();

if (validMedications.length > 0) 
  {
    await globalInsert(
      "prescriptions",
     {
       practice_id: visit.practice_id,

       visit_id: visitId,

       doctor_id: user.id, 
       patient_id: visit.patient.id,

       medications: validMedications,

       dosage: dosageSummary || null,

       prescription_number: prescriptionNumber,

       pharmacist_note: null,

       status: PrescriptionStatus.PENDING,

       locked: false,

       doctor_snapshot: {
       id: user.id,
       created_at: now
       },

     created_by: user.id,
     updated_by: user.id,
     created_at: now
     }
      );
     }

   

      await globalInsert("audit_logs", {
               actor_id: user.id,
               actor_role: "consultant",
               entity: "consultations",
               entity_id: visitId,
               action: "CREATE",
               practice_id: visit.practice_id
           });

      setSuccess("Consultation saved successfully");

    }
    catch (err) {

      console.error(err);
      setError(err.message || "Failed to save consultation");

    }

    setSaving(false);
  }

  if (loading)
    return <div style={container}>Loading consultation...</div>;

  if (!visit)
    return <div style={container}>Visit not found</div>;


  return (
    <div style={container}>

      <h1 style={header}>Consultation</h1>

      {error && <div style={messageError}>{error}</div>}
      {success && <div style={messageSuccess}>{success}</div>}

      <div style={card}>
        <h3>Patient</h3>
        <p>{visit.patient?.full_name}</p>
        <p>ID: {visit.patient?.id_number}</p>
      </div>

      <div style={card}>
        <h3>Vitals</h3>
        {vitals ? (
          <>
            <p>BP: {vitals.blood_pressure}</p>
            <p>HR: {vitals.heart_rate}</p>
            <p>Temp: {vitals.temperature}</p>
            <p>O₂: {vitals.oxygen_saturation}</p>
            <p>Weight: {vitals.weight}</p>
            <p>Height: {vitals.height}</p>
          </>
        ) : (
          <p>No vitals recorded</p>
        )}
      </div>

      <div style={card}>
        <h3>Patients' Symptoms/ Reason For Visit</h3>
        <textarea
          style={textarea}
          rows={5}
          value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
        />

        <h3>Diagnosis</h3>
        <input
          style={input}
          value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)}
        />

        <h3>Doctors Notes</h3>
        <textarea
          style={textarea}
          rows={5}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <h3>Pharmacy Notes</h3>
        <textarea
          style={textarea}
          rows={5}
          value={pharmacy_note}
          onChange={e => setPharmacy_Note(e.target.value)}
        />

      </div>

      <div style={card}>
        <h3>Prescription</h3>

        {medications.map((med, index) => (
          <div key={index}>
            <input
              style={input}
              placeholder="Medication Name"
              value={med.name}
              onChange={e =>
                updateMedication(index, "name", e.target.value)
              }
            />
            <input
              style={input}
              placeholder="Dosage"
              value={med.dosage}
              onChange={e =>
                updateMedication(index, "dosage", e.target.value)
              }
            />
            <input
              style={input}
              placeholder="Frequency"
              value={med.frequency}
              onChange={e =>
                updateMedication(index, "frequency", e.target.value)
              }
            />
          </div>
        ))}

        <button style={buttonPrimary} onClick={addMedication}>
          Add Medication
        </button>
      </div>

      <button
        style={{ ...buttonPrimary, marginTop: 20 }}
        onClick={saveConsultation}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Consultation"}
      </button>

    </div>
  );
}