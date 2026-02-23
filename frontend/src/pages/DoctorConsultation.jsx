import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { globalUpdate, globalSelect } from "../lib/globalDataLayer";
import { VisitStatus } from "../constants/visitStatus";

import {
  container,
  header,
  buttonPrimary,
  table,
  th,
  td,
  messageError
} from "../styles/styles";

export default function DoctorConsultation() {

  const [visits, setVisits] = useState([]);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    initialize();

  }, []);


  async function initialize() {

    try {

      setLoading(true);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user)
        throw new Error("Not authenticated");

      setUser(user);

      const profileData =
        await globalSelect(
          "profiles",
          query =>
            query
              .select("*")
              .eq("id", user.id)
              .single()
        );

      if (!profileData)
        throw new Error("Profile not found");

      if (profileData.role !== "consultant")
        throw new Error("Access denied");

      setProfile(profileData);

      await loadVisits(profileData.practice_id);

      setLoading(false);

    }
    catch (err) {

      console.error(err);
      setError(err.message);
      setLoading(false);

    }

  }

  async function loadVisits(practice_id) {

    try {

      const data =
        await globalSelect(
          "visits",
          query =>
            query
              .select(`
                id,
                patient_id,
                doctor_id,
                status,
                created_at,
                patients(full_name)
              `)
              .eq("practice_id", practice_id)
              .eq("status", VisitStatus.OPEN)
              .order("created_at", { ascending: false })
        );

      setVisits(data || []);

    }
    catch (err) {

      console.error(err);
      setVisits([]);

    }

  }

  async function startConsultation(visit) {

    try {

      if (!user || !profile)
        throw new Error("User not ready");

      if (
        visit.doctor_id &&
        visit.doctor_id !== user.id
      ) {

        alert(
          "Already assigned to another doctor"
        );

        return;

      }

      await globalUpdate(
        "visits",
        { id: visit.id },
        {
          doctor_id: user.id,
          status: VisitStatus.OPEN,
          updated_at:
            new Date().toISOString()
        }
      );

      window.location =
        "/consultant/" + visit.id;

    }
    catch (err) {

      console.error(err);
      setError("Failed to start consultation");

    }

  }


  if (loading)
    return <div style={container}>Loading...</div>;

  if (error)
    return (
      <div style={container}>
        <div style={messageError}>
          {error}
        </div>
      </div>
    );


  return (

    <div style={container}>

      <h2 style={header}>
        Doctor Queue
      </h2>

      <table style={table}>

        <thead>

          <tr>

            <th style={th}>
              Patient
            </th>

            <th style={th}>
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {visits.map(visit => (

            <tr key={visit.id}>

              <td style={td}>
                {visit.patients?.full_name}
              </td>

              <td style={td}>

                <button
                  style={buttonPrimary}
                  onClick={() =>
                    startConsultation(visit)
                  }
                >
                  Start
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}
