import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { globalInsert, globalSelect } from "../lib/globalDataLayer";
import { VisitStatus } from "../constants/visitStatus";

import {
  container,
  header,
  card,
  input,
  buttonPrimary,
  messageError,
  messageSuccess,
} from "../styles/styles";

const DEPARTMENTS = [
  "Casualty",
  "OPD",
  "Internal Medicine",
  "Surgery",
  "Pediatrics",
  "Obstetrics & Gynecology",
];

export default function Reception() {


  const [profile, setProfile] = useState(null);

  const [searchId, setSearchId] = useState("");
  const [patient, setPatient] = useState(null);

  const [queue, setQueue] = useState([]);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [creatingPatient, setCreatingPatient] = useState(false);

  const [newFullName, setNewFullName] = useState("");
  const [newIdNumber, setNewIdNumber] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [selectedDepartment, setSelectedDepartment] = useState(DEPARTMENTS[0]);


  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [medicalAidName, setMedicalAidName] = useState("");
  const [medicalAidNumber, setMedicalAidNumber] = useState("");


  const [creatingVisit, setCreatingVisit] = useState(false);


  useEffect(() => {

    loadProfile();

  }, []);

  useEffect(() => {

    if (profile) {
      loadQueue();
    }

  }, [profile]);


  async function loadProfile() {

    try {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const profileData = await globalSelect(
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


  async function loadQueue() {

    try {

      if (!profile || !profile.practice_id) return;

      const data = await globalSelect(
        "visits",
        query =>
          query
            .select(`
              id,
              patient_id,
              department,
              payment_method,
              created_at,
              patients(
                full_name,
                id_number
              )
            `)
            .eq("status", VisitStatus.OPEN)
            .eq("practice_id", profile.practice_id)
            .order("created_at", { ascending: false })
      );

      setQueue(data || []);

    }
    catch (err) {

      console.error(err);
      setError("Failed to load queue");

    }

  }


  async function searchPatient() {

    setError(null);
    setSuccess(null);
    setPatient(null);

    if (!searchId) {

      setError("Enter ID Number");
      return;

    }

    if (!profile || !profile.practice_id) {

      setError("Profile not loaded yet");
      return;

    }

    try {

      const result = await globalSelect(
        "patients",
        query =>
          query
            .select("*")
            .eq("id_number", searchId)
            .eq("practice_id", profile.practice_id)
      );

      if (!result || result.length === 0) {

        setCreatingPatient(true);
        setNewIdNumber(searchId);

      }
      else {

        setPatient(result[0]);
        setCreatingPatient(false);

      }

    }
    catch (err) {

      console.error(err);

      setCreatingPatient(true);
      setNewIdNumber(searchId);

    }

  }


  async function registerPatient() {

  setError(null);
  setSuccess(null);

  if (!newFullName || !newIdNumber) {
    setError("Full name and ID required");
    return;
  }

  if (!profile?.practice_id) {
    setError("Profile not loaded yet");
    return;
  }

  try {

    const now = new Date().toISOString();

    await globalInsert("patients", {
      full_name: newFullName,
      id_number: newIdNumber,
      phone: newPhone || null,
      practice_id: profile.practice_id,
      created_by: profile.id,
      created_at: now
    });

    const result = await globalSelect(
      "patients",
      query =>
        query
          .select("*")
          .eq("id_number", newIdNumber)
          .eq("practice_id", profile.practice_id)
          .single()
    );

    if (!result) {
      throw new Error("Patient insert verification failed");
    }

    setPatient(result);

    setCreatingPatient(false);
    setNewFullName("");
    setNewPhone("");

    setSuccess("Patient registered successfully");

  }
  catch (err) {

    console.error(err);
    setError("Failed to register patient");

  }

}




  async function checkDuplicateVisit() {

    if (!patient || !patient.id) return false;

    const existing = await globalSelect(
      "visits",
      query =>
        query
          .select("id")
          .eq("patient_id", patient.id)
          .eq("status", VisitStatus.OPEN)
          .eq("practice_id", profile.practice_id)
          .limit(1)
    );

    return existing && existing.length > 0;

  }

  async function createVisit() {

    if (!patient || !patient.id) {

      setError("No valid patient selected");
      return;

    }

    if (!profile || !profile.practice_id) {

      setError("Profile not loaded");
      return;

    }

    if (creatingVisit) return;

    setCreatingVisit(true);
    setError(null);
    setSuccess(null);

    try {

      const duplicate = await checkDuplicateVisit();

      if (duplicate) {

        setError("Patient already has an active visit");
        setCreatingVisit(false);
        return;

      }

      if (
        paymentMethod !== "cash" &&
        (!medicalAidName || !medicalAidNumber)
      ) {

        setError("Medical aid details required");
        setCreatingVisit(false);
        return;

      }

         await globalInsert(
          "visits",
          {
            patient_id: patient.id,

            department: selectedDepartment,

            payment_type: paymentMethod,

           medical_aid_name:
           paymentMethod === "cash"
           ? null
           : medicalAidName,

            medical_aid_number:
              paymentMethod === "cash"
             ? null
             : medicalAidNumber,

               status: VisitStatus.OPEN,

               practice_id: profile.practice_id,

                created_by: profile.id,
                created_at: new Date().toISOString()
      }
      );


      setSuccess("Visit created successfully");


      setPatient(null);
      setSearchId("");

      setPaymentMethod("cash");
      setMedicalAidName("");
      setMedicalAidNumber("");

      loadQueue();

    }
    catch (err) {

      console.error(err);
      setError("Failed to create visit");

    }

    setCreatingVisit(false);

  }


  return (

    <div style={container}>

      <h1 style={header}>Reception</h1>

      {error && <div style={messageError}>{error}</div>}
      {success && <div style={messageSuccess}>{success}</div>}


      <div style={card}>

        <input
          type="text"
          placeholder="Enter ID Number"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          style={input}
        />

        <button
          style={buttonPrimary}
          onClick={searchPatient}
        >
          Search
        </button>

      </div>


      {patient && (

        <div style={card}>

          <h3>{patient.full_name}</h3>

          <div>ID: {patient.id_number}</div>

          <select
            value={selectedDepartment}
            onChange={(e) =>
              setSelectedDepartment(e.target.value)
            }
            style={input}
          >

            {DEPARTMENTS.map(dep => (
              <option key={dep}>{dep}</option>
            ))}

          </select>


          <div style={{ marginTop: 10 }}>

            <label>
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
              />
              Cash
            </label>

            <label style={{ marginLeft: 15 }}>
              <input
                type="radio"
                value="medical_aid"
                checked={paymentMethod === "medical_aid"}
                onChange={() => setPaymentMethod("medical_aid")}
              />
              Medical Aid
            </label>

            <label style={{ marginLeft: 15 }}>
              <input
                type="radio"
                value="state"
                checked={paymentMethod === "state"}
                onChange={() => setPaymentMethod("state")}
              />
              State Funding
            </label>

          </div>


          {paymentMethod !== "cash" && (

            <>
              <input
                placeholder="Medical Aid Name"
                value={medicalAidName}
                onChange={(e) =>
                  setMedicalAidName(e.target.value)
                }
                style={input}
              />

              <input
                placeholder="Membership Number"
                value={medicalAidNumber}
                onChange={(e) =>
                  setMedicalAidNumber(e.target.value)
                }
                style={input}
              />
            </>

          )}

          <button
            style={buttonPrimary}
            onClick={createVisit}
            disabled={creatingVisit}
          >

            {creatingVisit
              ? "Creating..."
              : "Create Visit"}

          </button>

        </div>

      )}


      {creatingPatient && (

        <div style={card}>

          <h3>Register New Patient</h3>

          <input
            placeholder="Full Name"
            value={newFullName}
            onChange={(e) =>
              setNewFullName(e.target.value)
            }
            style={input}
          />

          <input
            value={newIdNumber}
            disabled
            style={input}
          />

          <input
            placeholder="Phone"
            value={newPhone}
            onChange={(e) =>
              setNewPhone(e.target.value)
            }
            style={input}
          />

          <button
            style={buttonPrimary}
            onClick={registerPatient}
          >
            Register Patient
          </button>

        </div>

      )}

     

      <div style={card}>

        <h3>Queue</h3>

        {queue.map(v => (

          <div key={v.id}>

            {v.patients?.full_name}
            {" — "}
            {v.department}
            {" — "}
            {v.payment_method}

          </div>

        ))}

      </div>

    </div>

  );

}
