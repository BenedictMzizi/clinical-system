export function parseMedications(medications) {

    if (!medications)
        return [];

    if (Array.isArray(medications))
        return medications;

    try {

        return JSON.parse(medications);

    } catch {

        return [];

    }

}



export function medicationCount(medications) {

    return parseMedications(
        medications
    ).length;

}



export function formatMedications(medications) {

    return parseMedications(
        medications
    )
    .map(m =>

        `${m.name || ""} ${m.dosage || ""} ${m.frequency || ""}`.trim()

    )
    .join(", ");

}



export function medicationTotalPrice(

    medications,

    itemPrice

){

    return medicationCount(

        medications

    ) * itemPrice;

}



export function hasMedication(

    medications

){

    return medicationCount(

        medications

    ) > 0;

}



export function getMedicationNames(

    medications

){

    return parseMedications(

        medications

    ).map(

        med => med.name

    );

}
