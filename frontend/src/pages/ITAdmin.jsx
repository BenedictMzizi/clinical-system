import React, { useEffect, useState } from "react";
import { globalSelect, globalUpdate } from "../lib/globalDataLayer";
import { container, header, card, buttonPrimary } from "../styles/styles";

export default function ITAdmin() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const data = await globalSelect("profiles");
    setUsers(data || []);
  }

  async function toggleActive(user) {
    await globalUpdate("profiles", { id: user.id }, { is_active: !user.is_active });
    loadUsers();
  }

  return (
    <div style={container}>
      <h2 style={header}>IT Admin</h2>
      {users.map((user) => (
        <div key={user.id} style={card}>
          {user.full_name}
          <button style={buttonPrimary} onClick={() => toggleActive(user)}>
            Toggle
          </button>
        </div>
      ))}
    </div>
  );
}
