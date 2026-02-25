import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  input,
  buttonPrimary,
  card,
  messageError
} from "../styles/styles";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getRedirectPath(role) {
    switch (role) {
      case "nurse":
        return "/vitals";
      case "receptionist":
        return "/reception";
      case "consultant":
        return "/consultant";
      case "pharmacist":
        return "/pharmacy";
      case "it":
        return "/it-admin";
      case "admin":
        return "/admin";
      default:
        return "/login";
    }
  }

  useEffect(() => {

    async function checkSession() {

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("id, role, is_active, practice_id")
          .eq("id", session.user.id)
          .single();

      if (!profile?.is_active) return;

      localStorage.setItem(
        "profile",
        JSON.stringify({
          id: session.user.id,
          role: profile.role,
          practice_id: profile.practice_id
        })
      );

      navigate(getRedirectPath(profile.role), { replace: true });
    }

    checkSession();

  }, [navigate]);

  async function handleLogin(e) {

    e.preventDefault();

    setLoading(true);
    setError("");

    try {

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role, is_active, practice_id")
          .eq("id", data.user.id)
          .single();

      if (profileError) throw profileError;

      if (!profile?.is_active)
        throw new Error("Account disabled");

      localStorage.setItem(
        "profile",
        JSON.stringify({
          id: data.user.id,
          role: profile.role,
          practice_id: profile.practice_id
        })
      );

      navigate(getRedirectPath(profile.role), { replace: true });

    }
    catch (err) {
      setError(err.message);
    }
    finally {
      setLoading(false);
    }
  }
const demoAccounts = [
  { role: "Receptionist", email: "reception@test.com" },
  { role: "Consultant", email: "doctor@test.com" },
  { role: "Pharmacist", email: "pharmacy@test.com" },
  { role: "Nurse", email: "nurse@test.com" },
];

function useDemoAccount(email) {
  setEmail(email);
  setPassword("password");
}
  return (

    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>

      <form
        style={{
          ...card,
          width: 320,
          padding: 30
        }}
        onSubmit={handleLogin}
      >

        <h2>Clinical System Login</h2>

        <input
          style={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          style={buttonPrimary}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error &&
          <div style={messageError}>
            {error}
          </div>
        }
        <hr style={{ margin: "20px 0" }} />

<div style={{ fontSize: 13 }}>
  <h4 style={{ marginBottom: 8 }}>Demo Access (Role-Based)</h4>
  <p style={{ marginBottom: 10 }}>
    Select a role to explore the workflow:
  </p>

  {demoAccounts.map(account => (
    <div
      key={account.role}
      onClick={() => useDemoAccount(account.email)}
      style={{
        cursor: "pointer",
        padding: "6px 0",
        color: "#2563eb"
      }}
    >
      {account.role}
    </div>
  ))}

  <p style={{ marginTop: 10, fontStyle: "italic" }}>
    Password: <strong>auto fills</strong>
  </p>
</div>

      </form>

    </div>

  );
}
