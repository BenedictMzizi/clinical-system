import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

export function useRoleGuard(allowedRoles = []) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.user.id)
        .single();

      setAuthorized(allowedRoles.includes(data.role));
    }
    check();
  }, []);

  return authorized;
}
