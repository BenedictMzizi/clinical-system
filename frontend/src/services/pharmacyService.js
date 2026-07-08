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

  }
  
  function parseMedications(medications) 
  {
   if (!medications) return [];

   if (Array.isArray(medications))
    return medications;

   try {
    return JSON.parse(medications);
  } catch {
    return [];
  }
}



  function formatMedications(medications) {

    if (!medications) return "N/A";

    let meds = medications;

    if (typeof meds === "string") {
      try {
        meds = JSON.parse(meds);
      }
      catch {
        return meds;
      }
    }

    if (Array.isArray(meds)) {

      return meds.map(m =>
        `${m.name || ""} ${m.dosage || ""} ${m.frequency || ""}`.trim()
      ).join(", ");

    }

    return "N/A";

  }


  function calculateBilling(prescription) {

    try {

      const meds = parseMedications(p.medications);

      let total = meds.length * 10;

      if (prescription.patient?.insurance === true)
        total = 0;

      return total;

    }
    catch {

      return 0;

    }

  }

  async function loadPrescriptions() {

    setLoading(true);
    setError(null);

    try {

      if (!profile?.practice_id) return;

      const { data, error } =
        await supabase
          .from("prescriptions")
          .select(`
            id,
            practice_id,
            visit_id,
            patient_id,
            medications,
            pharmacist_note,
            status,
            locked,
            created_at,
            patient:patients(
              id,
              full_name,
              id_number,
              insurance
            )
          `)
          .eq("practice_id", profile.practice_id)
          .eq("status", PrescriptionStatus.PENDING)
          .eq("locked", false)
          .order("created_at", { ascending: true });

      if (error) throw error;

      setPrescriptions(data || []);

    }
    catch (err) {

      console.error(err);
      setError("Failed to load prescriptions");

    }

    setLoading(false);

  }

  const filteredPrescriptions = prescriptions.filter(p => {

  const patientName =
    p.patient?.full_name?.toLowerCase() || "";

  const idNumber =
    p.patient?.id_number || "";

  return (
    patientName.includes(search.toLowerCase()) ||
    idNumber.includes(search)
  );

});

  async function billingExists(prescriptionId) {

    const existing =
      await globalSelect(
        "billing",
        query =>
          query
            .select("id")
            .eq("prescription_id", prescriptionId)
            .limit(1)
      );

    return existing?.length > 0;

  }



  async function prepareMedication(prescription) {

    if (dispensingId) return;

    setDispensingId(prescription.id);
    setError(null);

    try {


      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user)
        throw new Error("Not authenticated");


      if (prescription.locked)
        throw new Error("Prescription locked");


      const exists =
        await billingExists(prescription.id);

      if (exists)
        throw new Error("Billing already exists");


      const amount =
        calculateBilling(prescription);


      await globalInsert(
        "billing",
        {
          practice_id: profile.practice_id,

          prescription_id: prescription.id,
          visit_id: prescription.visit_id,
          patient_id: prescription.patient_id,

          amount,

          status:
            amount > 0
              ? BillingStatus.PENDING
              : BillingStatus.PAIDCONSULTATION,

          created_by: user.id,
          created_at: new Date().toISOString()
        }
      );


      await globalUpdate(
      "prescriptions",
       { id: prescription.id },
        {
          status: PrescriptionStatus.READY_FOR_COLLECTION,
          locked: true,
          prepared_by: user.id,
          prepared_at: new Date().toISOString(),
          updated_by: user.id
         }
        );


             await globalInsert(
              "audit_logs",
              {
                practice_id: profile.practice_id,
                actor_id: user.id,
                action: "MEDICATION_PREPARED",
                entity: "prescription",
                entity_id: prescription.id,
                created_at: new Date().toISOString()
                }
              );
      
           


      await loadPrescriptions();
      await loadReadyPrescriptions();
      setSelectedPrescription(null);

    }
    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Dispense failed"
      );

    }

    setDispensingId(null);

  }

  async function loadReadyPrescriptions() {

  if (!profile?.practice_id) return;

  try {

    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        patient:patients(*)
      `)
      .eq("practice_id", profile.practice_id)
      .eq(
        "status",
        PrescriptionStatus.READY_FOR_COLLECTION
      );

    if (error) throw error;

    setReadyPrescriptions(data || []);

  } catch (err) {
    console.error(err);
  }
}

async function confirmCollection(prescription) {

  const { data: { user } } =
    await supabase.auth.getUser();

  await globalUpdate(
    "prescriptions",
    { id: prescription.id },
    {
      status: PrescriptionStatus.DISPENSED,
      dispensed_by: user.id,
      dispensed_at: new Date().toISOString()
    }
  );

  await globalInsert("audit_logs", {

  practice_id: profile.practice_id,
  actor_id: user.id,
  action: "MEDICATION_COLLECTED",
  entity: "prescription",
  entity_id: prescription.id,
  created_at: new Date().toISOString()

});

  await globalUpdate(
    "visits",
    { id: prescription.visit_id },
    {
      status: VisitStatus.CLOSED,
      updated_at: new Date().toISOString()
    }
  );

  await loadReadyPrescriptions();
  await loadPrescriptions();

}
  useEffect(() => {

    loadProfile();

  }, []);
