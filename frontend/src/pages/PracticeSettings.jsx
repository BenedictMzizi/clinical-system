import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PracticeSettings() {
  const [settings, setSettings] = useState({
    name: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("practice_settings")
      .select("*")
      .single();

    if (data) setSettings(data);
  }

  async function saveSettings() {
    await supabase
      .from("practice_settings")
      .upsert(settings);

    alert("Settings saved");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Practice Settings</h2>

      <label>Name</label>
      <input
        value={settings.name}
        onChange={(e) =>
          setSettings({ ...settings, name: e.target.value })
        }
      />

      <br />

      <label>Address</label>
      <input
        value={settings.address}
        onChange={(e) =>
          setSettings({ ...settings, address: e.target.value })
        }
      />

      <br />

      <label>Phone</label>
      <input
        value={settings.phone}
        onChange={(e) =>
          setSettings({ ...settings, phone: e.target.value })
        }
      />

      <br />
      <br />

      <button onClick={saveSettings}>
        Save
      </button>
    </div>
  );
}
