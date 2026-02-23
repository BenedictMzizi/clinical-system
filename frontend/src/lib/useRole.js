import { supabase }
from "./supabase";

export async function getUserRole() {

  const user =
    (await supabase.auth.getUser())
      .data.user;

  if (!user)
    return null;

  const { data }
    = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  return data.role;

}
