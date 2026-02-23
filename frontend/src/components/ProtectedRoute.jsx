import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";


export default function ProtectedRoute({

  children,
  allowedRoles = []

}) {

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {

    async function checkAuth() {

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("role,is_active")
          .eq("id", user.id)
          .single();

      if (profile?.is_active)
        setRole(profile.role);

      setLoading(false);
    }

    checkAuth();

  }, []);

  if (loading)
    return (
      <div style={{ padding: 20 }}>
        Checking authentication...
      </div>
    );

  if (!user)
    return <Navigate to="/login" replace />;

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  )
    return (
      <div style={{ padding: 20 }}>
        Access denied: insufficient permissions
      </div>
    );

  return children;

}
