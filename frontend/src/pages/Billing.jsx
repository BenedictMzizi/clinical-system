import React, { useEffect, useState } from "react";
import { globalSelect, globalUpdate } from "../lib/globalDataLayer";
import { container, header, card, buttonPrimary, messageError } from "../styles/styles";

export default function Billing() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    const data = await globalSelect("medical_aid_claims", (query) =>
      query.select(`*, visit:visits(patient:patients(full_name))`)
    );

    setClaims(data || []);
    setLoading(false);
  }

  async function submitClaim(claim) {
    try {
      await globalUpdate("medical_aid_claims", { id: claim.id }, {
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
      loadClaims();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div>Loading billing...</div>;

  return (
    <div style={container}>
      <h2 style={header}>Billing</h2>
      {claims.length === 0 && <div>No claims found.</div>}
      {claims.map((claim) => (
        <div key={claim.id} style={card}>
          {claim.visit?.patient?.full_name}
          <button style={buttonPrimary} onClick={() => submitClaim(claim)}>
            Submit
          </button>
        </div>
      ))}
    </div>
  );
}
