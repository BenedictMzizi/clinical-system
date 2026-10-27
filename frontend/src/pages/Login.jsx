
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Luxurious Gold Hospital Workflow Logo-3.png";
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
      case "nurse": return "/vitals";
      case "receptionist": return "/reception";
      case "consultant": return "/consultant";
      case "pharmacist": return "/pharmacy";
      case "cashier":
      case "billing": return "/billing";
      case "it": return "/it-admin";
      case "admin": return "/admin";
      default: return "/login";
    }
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: profile } = await supabase
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
      if (!profile?.is_active) {
        throw new Error("Account disabled");
      }

      localStorage.setItem(
        "profile",
        JSON.stringify({
          id: data.user.id,
          role: profile.role,
          practice_id: profile.practice_id
        })
      );

      navigate(getRedirectPath(profile.role), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { role: "Receptionist", email: "reception@test.com" },
    { role: "Nurse", email: "nurse@test.com" },
    { role: "Consultant", email: "doctor@test.com" },
    { role: "Pharmacist", email: "pharmacy@test.com" },
    { role: "Cashier", email: "billing@test.com" }
  ];

  function useDemoAccount(accountEmail) {
    setEmail(accountEmail);
    setPassword("password");
    setError("");
  }

  const gold = "#D4AF37";

  const fieldStyle = {
    ...input,
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: 14,
    border: "1px solid #D4AF37",
    borderRadius: 8,
    background: "#171717",
    color: "#FFFFFF",
    outlineColor: gold
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background:
          "linear-gradient(135deg, #090909 0%, #191713 55%, #080808 100%)",
        color: "#F8F5EC",
        position: "relative"
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          ...card,
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 410,
          boxSizing: "border-box",
          padding: "32px 28px",
          borderRadius: 18,
          border: "1px solid rgba(212,175,55,0.65)",
          background: "rgba(15,15,15,0.94)",
          color: "#F8F5EC",
          boxShadow: "0 18px 55px rgba(0,0,0,0.45)"
        }}
      >
        <header style={{ textAlign: "center", marginBottom: 26 }}>
          <img
            src={logo}
            alt="HWMS Hospital Workflow Management System"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 230,
              height: 145,
              objectFit: "contain",
              margin: "0 auto 14px"
            }}
          />

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 25,
              fontWeight: 700,
              color: gold,
              letterSpacing: "0.03em"
            }}
          >
            Welcome to HWMS
          </h1>

          <p style={{ margin: 0, color: "#D0CBC0", fontSize: 13 }}>
            Hospital Workflow Management System
          </p>

          <div
            style={{
              width: 65,
              height: 2,
              background: gold,
              margin: "20px auto 0"
            }}
          />
        </header>

        <label
          htmlFor="email"
          style={{ display: "block", marginBottom: 7, fontSize: 13 }}
        >
          Email address
        </label>

        <input
          id="email"
          style={fieldStyle}
          type="email"
          placeholder="Enter your email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label
          htmlFor="password"
          style={{ display: "block", marginBottom: 7, fontSize: 13 }}
        >
          Password
        </label>

        <input
          id="password"
          style={fieldStyle}
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonPrimary,
            display: "block",
            width: "100%",
            padding: "13px 16px",
            marginTop: 8,
            border: `1px solid ${gold}`,
            borderRadius: 8,
            background: loading ? "#8C762F" : gold,
            color: "#111111",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer"
          }}
        >
          {loading ? "Signing in..." : "Sign in securely"}
        </button>

        {error && (
          <div
            role="alert"
            style={{
              ...messageError,
              marginTop: 14,
              padding: 12,
              borderRadius: 8,
              background: "#381B1B",
              color: "#FFB8B8",
              border: "1px solid #8D4141"
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            height: 1,
            background: "rgba(212,175,55,0.3)",
            margin: "25px 0 20px"
          }}
        />

        <h3
          style={{
            color: gold,
            fontSize: 14,
            margin: "0 0 6px"
          }}
        >
          Demo access
        </h3>

        <p style={{ color: "#D0CBC0", fontSize: 12, marginBottom: 14 }}>
          Select a role to populate the demo credentials.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          {demoAccounts.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => useDemoAccount(account.email)}
              style={{
                width: "100%",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                borderRadius: 7,
                border: "1px solid #454039",
                background: "#1C1B18",
                color: "#F5E7B5",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <span>{account.role}</span>
              <span style={{ color: gold, fontSize: 12 }}>
                Select →
              </span>
            </button>
          ))}
        </div>

        <p
          style={{
            margin: "14px 0 0",
            color: "#AFA99D",
            fontSize: 11,
            textAlign: "center"
          }}
        >
          Demo password: password
        </p>
      </form>
    </main>
  );
}
