import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Footer from "../components/Footer";
import hwmsLogo from "../assets/Luxurious Gold Hospital Workflow Logo-3.png";

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

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

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
          setFullName(data.full_name || session.user.email || "Staff member");
          setLoading(false);
        }
      } catch (error) {
        console.error("Unable to initialize HWMS layout:", error);
        if (mounted) {
          setLoading(false);
          navigate("/login", { replace: true });
        }
      }
    }

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) navigate("/login", { replace: true });
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  async function logout() {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function MenuItem({ label, path }) {
    const active =
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(`${path}/`));

    return (
      <button
        type="button"
        onClick={() => {
          navigate(path);
          setSidebarOpen(false);
        }}
        aria-current={active ? "page" : undefined}
        className={`group flex w-full items-center px-4 py-3 rounded-xl text-left
          font-medium transition-all duration-200 border
          ${
            active
              ? "bg-amber-400/15 text-amber-300 border-amber-400/30 shadow-sm"
              : "text-gray-400 hover:bg-white/5 hover:text-white border-transparent"
          }`}
      >
        <span className="tracking-wide">{label}</span>
        {active && (
          <span className="ml-auto h-2 w-2 rounded-full bg-amber-300 opacity-90" />
        )}
      </button>
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
            <MenuItem label="Billing" path="/billing" />
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
      case "cashier":
      case "billing":
        return <MenuItem label="Billing" path="/billing" />;
      case "it":
        return <MenuItem label="IT Admin" path="/it-admin" />;
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F2EB] px-4">
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6DFCE] bg-white px-7 py-6 shadow-sm">
          <div className="h-10 w-10 animate-pulse overflow-hidden">
            <img src={hwmsLogo} alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-semibold text-[#111111]">Loading HWMS</p>
            <p className="mt-1 text-sm text-gray-500">
              Hospital Workflow Management System
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F2EB]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed z-30 top-0 left-0 w-64 h-full bg-[#111111]
          text-gray-300 flex flex-col border-r border-amber-500/20 shadow-xl
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-64"}
          md:translate-x-0`}
      >
        <div className="px-5 py-5 border-b border-amber-500/20 flex items-center gap-3">
          <img
            src={hwmsLogo}
            alt="HWMS logo"
            className="w-14 h-14 object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="text-lg font-bold text-white tracking-wide">HWMS</div>
            <div className="text-xs text-amber-300 leading-5">
              Hospital Workflow
              <br />
              Management System
            </div>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="md:hidden ml-auto text-gray-400 hover:text-amber-300"
            onClick={() => setSidebarOpen(false)}
          >
            &#10005;
          </button>
        </div>

        <div className="px-5 py-5 border-b border-gray-800">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-white font-semibold text-base break-words">
              {fullName}
            </div>
            <div className="text-xs text-amber-300 capitalize mt-1">{role}</div>
          </div>
        </div>

        <nav
          aria-label="Department navigation"
          className="flex-1 px-4 py-6 space-y-1 overflow-y-auto"
        >
          <RoleMenu />
        </nav>

        <div className="px-5 py-5 border-t border-gray-800">
          <button
            type="button"
            onClick={logout}
            className="w-full bg-amber-400 hover:bg-amber-300 text-black
              font-bold py-3 rounded-xl transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2
              focus:ring-offset-[#111111]"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <div className="md:hidden sticky top-0 z-10 flex justify-between items-center
          bg-[#111111] text-white px-4 py-3 shadow border-b border-amber-500/20">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg px-2 py-1 text-amber-300 hover:bg-white/10"
          >
            &#9776;
          </button>
          <div className="font-semibold tracking-wide">HWMS</div>
          <img src={hwmsLogo} alt="" className="h-8 w-8 object-contain" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
}
