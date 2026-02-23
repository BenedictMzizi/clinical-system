import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { container, card } from "../styles/styles";

export default function KPI() {
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("kpi_dashboard_view").select("*").single();
    setData(data);
  }

  if (!data) return <p>Loading...</p>;

  return (
    <div style={container}>
      <div style={card}>
        <p>Visits today: {data.visits_today}</p>
        <p>Patients registered: {data.patients_registered}</p>
        <p>Revenue: R {data.revenue}</p>
      </div>
    </div>
  );
}
