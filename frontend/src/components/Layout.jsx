import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, is_active")
        .eq("id", session.user.id)
        .single();

      if (error || !data?.is_active) {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      if (mounted) {
        setRole(data.role);
        setFullName(data.full_name);
        setLoading(false);
      }
    }

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) navigate("/login", { replace: true });
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  function MenuItem({ label, path }) {
    const active = location.pathname.startsWith(path);

    return (
      <div
        onClick={() => {
          navigate(path);
          setSidebarOpen(false); // close mobile menu
        }}
        className={`group flex items-center px-4 py-3 rounded-xl cursor-pointer font-medium transition-all duration-200
          ${active
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
      >
        <span className="tracking-wide">{label}</span>
        {active && (
          <span className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></span>
        )}
      </div>
    );
  }

  function RoleMenu() {
    switch (role) {
      case "admin":
        return (
          <div className="space-y-1">
            <MenuItem label="Dashboard" path="/admin" />
            <MenuItem label="Reception" path="/reception" />
            <MenuItem label="Vitals" path="/vitals" />
            <MenuItem label="Consultations" path="/consultant" />
            <MenuItem label="Pharmacy" path="/pharmacy" />
            <MenuItem label="IT Admin" path="/it-admin" />
          </div>
        );
      case "receptionist":
        return <MenuItem label="Reception" path="/reception" />;
      case "nurse":
        return <MenuItem label="Vitals" path="/vitals" />;
      case "consultant":
        return <MenuItem label="Consultations" path="/consultant" />;
      case "pharmacist":
        return <MenuItem label="Pharmacy" path="/pharmacy" />;
      case "it":
        return <MenuItem label="IT Admin" path="/it-admin" />;
      default:
        return null;
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white px-8 py-6 rounded-xl shadow-md text-lg font-semibold text-gray-700">
          Loading Clinical System...
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside
        className={`fixed z-20 top-0 left-0 w-64 h-full bg-gray-900 text-gray-300 flex flex-col shadow-xl transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">Clinical System</div>
            <div className="text-xs text-gray-500 mt-1">Hospital Management Platform</div>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            &#10005;
          </button>
        </div>

        {/* User */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-white font-semibold text-base">{fullName}</div>
            <div className="text-xs text-gray-400 capitalize mt-1">{role}</div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <RoleMenu />
        </nav>

        {/* Logout */}
        <div className="px-6 py-6 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Mobile top bar */}
        <div className="md:hidden flex justify-between items-center bg-gray-900 text-white px-4 py-3 shadow">
          <button onClick={() => setSidebarOpen(true)}>&#9776;</button>
          <div className="font-semibold">Clinical System</div>
          <div></div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
