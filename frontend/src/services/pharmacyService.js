
async function loadProfile() {

    try {
      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const profileData =
        await globalSelect(
          "profiles",
          query =>
            query
              .select("*")
              .eq("id", user.id)
              .single()
        );

      setProfile(profileData);

    }
    catch (err) {

      console.error(err);
      setError("Failed to load profile");

    }
