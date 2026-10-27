import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { globalInsert, globalSelect } from "../lib/globalDataLayer";
import { VisitStatus } from "../constants/visitStatus";
import {
  container,
  header,
  subHeader,
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
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [registeringPatient, setRegisteringPatient] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.practice_id) loadQueue();
    
  }, [profile]);

  async function loadProfile() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const profileData = await globalSelect("profiles", (query) =>
        query
          .select("*")
          .eq("id", user.id)
          .single()
      );

      if (!profileData) throw new Error("Staff profile was not found.");
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to load Reception profile:", err);
      setError("Failed to load your staff profile. Please refresh or sign in again.");
    }
  }

  async function loadQueue() {
    try {
      if (!profile?.practice_id) return;

      const data = await globalSelect("visits", (query) =>
        query
          .select(`
            id,
            patient_id,
            department,
            payment_type,
            status,
            created_at,
            patients (
              full_name,
              id_number
            )
          `)
          .eq("status", VisitStatus.OPEN)
          .eq("practice_id", profile.practice_id)
          .order("created_at", { ascending: false })
      );

      setQueue(data || []);
    } catch (err) {
      console.error("Failed to load Reception queue:", err);
      setError("Failed to load the patient queue.");
    }
  }

  async function searchPatient() {
    setError(null);
    setSuccess(null);
    setPatient(null);
    setCreatingPatient(false);

    const normalizedId = searchId.trim();
    if (!normalizedId) {
      setError("Enter the patient's ID number.");
      return;
    }

    if (!profile?.practice_id) {
      setError("Your staff profile has not loaded yet.");
      return;
    }

    setSearchingPatient(true);
    try {
      const result = await globalSelect("patients", (query) =>
        query
          .select("*")
          .eq("id_number", normalizedId)
          .eq("practice_id", profile.practice_id)
      );

      if (!result || result.length === 0) {
        setCreatingPatient(true);
        setNewIdNumber(normalizedId);
      } else {
        setPatient(result[0]);
      }
    } catch (err) {
      console.error("Failed to search for patient:", err);
      setError("Could not search for the patient. Please try again.");
    } finally {
      setSearchingPatient(false);
    }
  }

  async function registerPatient() {
    setError(null);
    setSuccess(null);

    const fullName = newFullName.trim();
    const idNumber = newIdNumber.trim();

    if (!fullName || !idNumber) {
      setError("Full name and ID number are required.");
      return;
    }

    if (!profile?.practice_id || !profile?.id) {
      setError("Your staff profile has not loaded yet.");
      return;
    }

    setRegisteringPatient(true);
    try {
      await globalInsert("patients", {
        full_name: fullName,
        id_number: idNumber,
        phone: newPhone.trim() || null,
        practice_id: profile.practice_id,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      });

      const result = await globalSelect("patients", (query) =>
        query
          .select("*")
          .eq("id_number", idNumber)
          .eq("practice_id", profile.practice_id)
          .single()
      );

      if (!result) throw new Error("Patient registration could not be verified.");

      setPatient(result);
      setCreatingPatient(false);
      setNewFullName("");
      setNewPhone("");
      setSuccess("Patient registered successfully.");
    } catch (err) {
      console.error("Failed to register patient:", err);
      setError(
        err?.message?.toLowerCase().includes("duplicate")
          ? "A patient with this ID number may already be registered at this facility."
          : "Failed to register the patient. Check the details and try again."
      );
    } finally {
      setRegisteringPatient(false);
    }
  }

  async function checkDuplicateVisit() {
    if (!patient?.id || !profile?.practice_id) return false;

    const existing = await globalSelect("visits", (query) =>
      query
        .select("id")
        .eq("patient_id", patient.id)
        .eq("status", VisitStatus.OPEN)
        .eq("practice_id", profile.practice_id)
        .limit(1)
    );

    return Boolean(existing?.length);
  }

  async function createVisit() {
    if (!patient?.id) {
      setError("Search for or register a patient before creating a visit.");
      return;
    }

    if (!profile?.practice_id || !profile?.id) {
      setError("Your staff profile has not loaded yet.");
      return;
    }

    if (creatingVisit) return;

    setCreatingVisit(true);
    setError(null);
    setSuccess(null);

    try {
      const duplicate = await checkDuplicateVisit();
      if (duplicate) {
        setError("This patient already has an active visit at this facility.");
        return;
      }

      if (paymentMethod !== "cash" && (!medicalAidName.trim() || !medicalAidNumber.trim())) {
        setError("Enter the funding provider and membership/reference number.");
        return;
      }

      await globalInsert("visits", {
        patient_id: patient.id,
        department: selectedDepartment,
        payment_type: paymentMethod,
        medical_aid_name: paymentMethod === "cash" ? null : medicalAidName.trim(),
        medical_aid_number: paymentMethod === "cash" ? null : medicalAidNumber.trim(),
        status: VisitStatus.OPEN,
        practice_id: profile.practice_id,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      });

      setSuccess("Visit created successfully.");
      setPatient(null);
      setSearchId("");
      setCreatingPatient(false);
      setPaymentMethod("cash");
      setMedicalAidName("");
      setMedicalAidNumber("");
      await loadQueue();
    } catch (err) {
      console.error("Failed to create visit:", err);
      setError("Failed to create the visit. Please try again.");
    } finally {
      setCreatingVisit(false);
    }
  }

  const fieldLabel = {
    display: "block",
    color: "#374151",
    fontSize: "13px",
    fontWeight: 650,
    marginBottom: 5,
  };

  return (
    <div style={container}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#A78325]">
            Patient services
          </p>
          <h1 style={header}>Reception &amp; Patient Registration</h1>
          <p className="mt-[-14px] text-sm text-gray-500">
            Find patients, register new patients, and create facility visits.
          </p>
        </div>
        <div className="rounded-xl border border-[#E6DFCE] bg-white px-4 py-3">
          <div className="text-xs text-gray-500">Active queue</div>
          <div className="text-2xl font-bold text-[#111111]">{queue.length}</div>
        </div>
      </div>

      {error && <div role="alert" style={messageError}>{error}</div>}
      {success && <div role="status" style={messageSuccess}>{success}</div>}

      <section style={card}>
        <h2 style={subHeader}>Find an existing patient</h2>
        <p className="mb-3 text-sm text-gray-500">
          Search using the patient's ID number within this facility.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            searchPatient();
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="patient-id-search" style={fieldLabel}>ID number</label>
            <input
              id="patient-id-search"
              type="text"
              placeholder="Enter ID number"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              style={{ ...input, marginBottom: 0 }}
            />
          </div>
          <button
            type="submit"
            style={{ ...buttonPrimary, minWidth: 120 }}
            disabled={searchingPatient}
          >
            {searchingPatient ? "Searching..." : "Search patient"}
          </button>
        </form>
      </section>

      {patient && (
        <section style={card}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#A78325]">
                Patient selected
              </p>
              <h2 className="text-xl font-bold text-[#111111]">{patient.full_name}</h2>
              <p className="mt-1 text-sm text-gray-500">ID: {patient.id_number}</p>
            </div>
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Patient found
            </span>
          </div>

          <h3 style={subHeader}>Create a visit</h3>
          <label htmlFor="visit-department" style={fieldLabel}>Department</label>
          <select
            id="visit-department"
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            style={input}
          >
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>

          <fieldset className="mt-2">
            <legend className="mb-3 text-sm font-semibold text-gray-700">
              Payment or funding method
            </legend>
            <div className="flex flex-wrap gap-3">
              {[
                ["cash", "Cash"],
                ["medical_aid", "Medical aid"],
                ["state", "State funding"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm
                    ${paymentMethod === value
                      ? "border-[#D4AF37] bg-[#FBF5E5] text-[#594719]"
                      : "border-[#E6DFCE] bg-white text-gray-700"}`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                    className="accent-[#A78325]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {paymentMethod !== "cash" && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="funding-provider" style={fieldLabel}>
                  {paymentMethod === "state" ? "Funding department/provider" : "Medical aid name"}
                </label>
                <input
                  id="funding-provider"
                  placeholder={paymentMethod === "state" ? "Enter provider" : "Enter medical aid"}
                  value={medicalAidName}
                  onChange={(event) => setMedicalAidName(event.target.value)}
                  style={input}
                />
              </div>
              <div>
                <label htmlFor="funding-reference" style={fieldLabel}>
                  Membership / reference number
                </label>
                <input
                  id="funding-reference"
                  placeholder="Enter reference number"
                  value={medicalAidNumber}
                  onChange={(event) => setMedicalAidNumber(event.target.value)}
                  style={input}
                />
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              style={buttonPrimary}
              onClick={createVisit}
              disabled={creatingVisit}
            >
              {creatingVisit ? "Creating visit..." : "Create visit"}
            </button>
            <button
              type="button"
              onClick={() => setPatient(null)}
              className="rounded-lg border border-[#E6DFCE] px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-[#F8F5ED]"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {creatingPatient && (
        <section style={card}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A78325]">
            New patient
          </p>
          <h2 style={subHeader}>Register patient</h2>
          <p className="mb-4 text-sm text-gray-500">
            No matching patient was found at this facility. Confirm the ID number before registering.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              registerPatient();
            }}
            className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="new-patient-name" style={fieldLabel}>Full name *</label>
              <input
                id="new-patient-name"
                placeholder="Patient full name"
                value={newFullName}
                onChange={(event) => setNewFullName(event.target.value)}
                style={input}
                required
              />
            </div>
            <div>
              <label htmlFor="new-patient-id" style={fieldLabel}>ID number *</label>
              <input
                id="new-patient-id"
                value={newIdNumber}
                onChange={(event) => setNewIdNumber(event.target.value)}
                style={input}
                required
              />
            </div>
            <div>
              <label htmlFor="new-patient-phone" style={fieldLabel}>Phone number</label>
              <input
                id="new-patient-phone"
                type="tel"
                placeholder="Patient contact number"
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                style={input}
              />
            </div>
            <div className="flex items-end gap-3 pb-3">
              <button
                type="submit"
                style={buttonPrimary}
                disabled={registeringPatient}
              >
                {registeringPatient ? "Registering..." : "Register patient"}
              </button>
              <button
                type="button"
                onClick={() => setCreatingPatient(false)}
                className="rounded-lg border border-[#E6DFCE] px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-[#F8F5ED]"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section style={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 style={subHeader}>Patient queue</h2>
            <p className="mt-[-10px] text-sm text-gray-500">
              Open visits currently registered at this facility.
            </p>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            className="rounded-lg border border-[#E6DFCE] px-3 py-2 text-sm font-semibold text-[#594719] hover:bg-[#FBF5E5]"
          >
            Refresh queue
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D9D3C6] bg-[#FCFBF8] px-5 py-10 text-center">
            <p className="font-semibold text-gray-700">No active visits</p>
            <p className="mt-1 text-sm text-gray-500">
              New visits will appear here after they are created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <th className="border-b border-[#E6DFCE] bg-[#F8F5ED] px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Patient
                  </th>
                  <th className="border-b border-[#E6DFCE] bg-[#F8F5ED] px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Department
                  </th>
                  <th className="border-b border-[#E6DFCE] bg-[#F8F5ED] px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Funding
                  </th>
                  <th className="border-b border-[#E6DFCE] bg-[#F8F5ED] px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {queue.map((visit) => (
                  <tr key={visit.id} className="hover:bg-[#FCFBF8]">
                    <td className="border-b border-[#EEEAE1] px-4 py-3">
                      <div className="font-semibold text-[#111111]">
                        {visit.patients?.full_name || "Unknown patient"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {visit.patients?.id_number || ""}
                      </div>
                    </td>
                    <td className="border-b border-[#EEEAE1] px-4 py-3 text-sm text-gray-700">
                      {visit.department || "—"}
                    </td>
                    <td className="border-b border-[#EEEAE1] px-4 py-3">
                      <span className="rounded-full bg-[#FBF5E5] px-3 py-1 text-xs font-semibold text-[#594719]">
                        {(visit.payment_type || "pending").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="border-b border-[#EEEAE1] px-4 py-3 text-sm text-gray-600">
                      {visit.created_at
                        ? new Date(visit.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
