import React, { useEffect, useState } from "react";
import { globalInsert, globalSelect } from "../lib/globalDataLayer";
import { supabase } from "../lib/supabase";

import {
  container,
  header,
  card,
  input,
  buttonPrimary,
  messageError,
  messageSuccess,
} from "../styles/styles";

export default function Vitals() {

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState("");

  const [temperature, setTemperature] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respRate, setRespRate] = useState("");
  const [oxygenSat, setOxygenSat] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      setUser(user);

      const profileData = await globalSelect(
        "profiles",
        query =>
          query
            .select("*")
            .eq("id", user.id)
            .single()
      );

      if (!profileData) {
        setError("Profile not found");
        setLoading(false);
        return;
      }

      if (profileData.role !== "nurse") {
        setError("Access denied. Nurse role required.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const visitData = await globalSelect(
        "visits",
        query =>
          query
            .select(`
              id,
              patient_id,
              patients(full_name)
            `)
            .eq("practice_id", profileData.practice_id)
            .eq("status", "OPEN")
            .order("created_at", { ascending: false })
      );

      setVisits(visitData || []);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setError("Failed to load vitals page");
      setLoading(false);
    }
  }

  async function saveVitals() {

    try {

      setError(null);
      setSuccess(null);

      if (!selectedVisit) {
        setError("Please select a patient visit");
        return;
      }

      const visit = visits.find(v => v.id === selectedVisit);

      if (!visit) {
        setError("Invalid visit selected");
        return;
      }

      await globalInsert("vitals", {
        patient_id: visit.patient_id,
        visit_id: visit.id,
        practice_id: profile.practice_id,

        temperature: temperature ? parseFloat(temperature) : null,
        blood_pressure: bloodPressure || null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        respiratory_rate: respRate ? parseInt(respRate) : null,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        notes: notes || null,
      });
      
      setSuccess("Vitals recorded successfully");
      
      clearForm();

    } catch (err) {
      console.error(err);
      setError("Failed to save vitals");
    }
  }

  function clearForm() {
    setSelectedVisit("");
    setTemperature("");
    setBloodPressure("");
    setHeartRate("");
    setRespRate("");
    setOxygenSat("");
    setWeight("");
    setHeight("");
    setNotes("");
  }

  if (loading) {
    return <div style={container}>Loading...</div>;
  }

  return (
    <div style={container}>

      <h1 style={header}>Nurse Vitals</h1>

      {error && <div style={messageError}>{error}</div>}
      {success && <div style={messageSuccess}>{success}</div>}

      <div style={card}>

        <label>Select Patient</label>

        <select
          style={input}
          value={selectedVisit}
          onChange={(e) => setSelectedVisit(e.target.value)}
        >
          <option value="">Select patient</option>

          {visits.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.patients?.full_name}
            </option>
          ))}

        </select>

        <input
          style={input}
          placeholder="Temperature °C"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />

        <input
          style={input}
          placeholder="Blood Pressure (120/80)"
          value={bloodPressure}
          onChange={(e) => setBloodPressure(e.target.value)}
        />

        <input
          style={input}
          placeholder="Heart Rate bpm"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
        />

        <input
          style={input}
          placeholder="Respiratory Rate"
          value={respRate}
          onChange={(e) => setRespRate(e.target.value)}
        />

        <input
          style={input}
          placeholder="Oxygen Saturation %"
          value={oxygenSat}
          onChange={(e) => setOxygenSat(e.target.value)}
        />

        <input
          style={input}
          placeholder="Weight kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <input
          style={input}
          placeholder="Height cm"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />

        <textarea
          style={input}
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button style={buttonPrimary} onClick={saveVitals}>
          Save Vitals
        </button>

      </div>

    </div>
  );
}
