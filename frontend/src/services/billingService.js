
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
