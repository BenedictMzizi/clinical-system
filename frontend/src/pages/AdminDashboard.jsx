import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  container,
  header,
  subHeader,
  card,
  th,
  td,
  table,
} from "../styles/styles";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    visits: 0,
    prescriptions: 0,
    revenue: 0,
  });

  const [recentVisits, setRecentVisits] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentVisits();
  }, []);

  async function loadStats() {
    const { count: patients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: visits } = await supabase
      .from("visits")
      .select("*", { count: "exact", head: true });

    const { count: prescriptions } = await supabase
      .from("prescriptions")
      .select("*", { count: "exact", head: true });

    const { data: billing } = await supabase
      .from("billing_records")
      .select("total_amount");

    const revenue = billing?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

    setStats({ patients, visits, prescriptions, revenue });
  }

  async function loadRecentVisits() {
    const { data } = await supabase
      .from("visits")
      .select(`id, created_at, patients(full_name)`)
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentVisits(data || []);
  }

  function StatCard({ title, value }) {
    return (
      <div style={card}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: "bold" }}>{value}</div>
      </div>
    );
  }

  return (
    <div style={container}>
      <h1 style={header}>Admin Dashboard</h1>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <StatCard title="Total Patients" value={stats.patients} />
        <StatCard title="Total Visits" value={stats.visits} />
        <StatCard title="Prescriptions" value={stats.prescriptions} />
        <StatCard title="Revenue" value={"R " + stats.revenue} />
      </div>

      {/* RECENT VISITS */}
      <div style={card}>
        <h2 style={subHeader}>Recent Visits</h2>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Patient</th>
              <th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentVisits.map((v) => (
              <tr key={v.id}>
                <td style={td}>{v.patients?.full_name}</td>
                <td style={td}>{new Date(v.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
