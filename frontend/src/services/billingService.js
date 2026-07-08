
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
