import React, { useMemo } from "react";

import {
    card
} from "../../styles/styles";

import {
    parseMedications
} from "../../utils/medicationUtils";

export default function PrescriptionModal({

    prescription,

    estimatedBill = 0,

    dispensingId,

    onPrepare,

    onClose

}) {

    const medications = useMemo(() => {

        return parseMedications(
            prescription?.medications
        );

    }, [prescription]);



    if (!prescription)
        return null;



    return (

        <div
            style={{
                ...card,
                marginTop: 25,
                border: "2px solid #2563eb",
                borderRadius: 10
            }}
        >

            <h2>

                Prescription Details

            </h2>

            <hr />



            {/* ======================================
                    PATIENT INFORMATION
            ======================================= */}

            <h3>

                Patient Information

            </h3>

            <table
                style={{
                    width: "100%",
                    marginBottom: 20
                }}
            >

                <tbody>

                    <tr>

                        <td>

                            <strong>

                                Name

                            </strong>

                        </td>

                        <td>

                            {prescription.patient?.full_name}

                        </td>

                    </tr>

                    <tr>

                        <td>

                            <strong>

                                ID Number

                            </strong>

                        </td>

                        <td>

                            {prescription.patient?.id_number}

                        </td>

                    </tr>

                    <tr>

                        <td>

                            <strong>

                                Insurance

                            </strong>

                        </td>

                        <td>

                            {

                                prescription.patient?.insurance

                                    ? "Covered"

                                    : "Private"

                            }

                        </td>

                    </tr>

                    <tr>

                        <td>

                            <strong>

                                Prescription Status

                            </strong>

                        </td>

                        <td>

                            {prescription.status}

                        </td>

                    </tr>

                </tbody>

            </table>



            <hr />



            {/* ======================================
                    MEDICATION LIST
            ======================================= */}

            <h3>

                Medication List

            </h3>

            {

                medications.length === 0 &&

                <div>

                    No medication prescribed.

                </div>

            }

            {

                medications.map((med, index) => (

                    <div

                        key={index}

                        style={{

                            border: "1px solid #ddd",

                            borderRadius: 8,

                            padding: 15,

                            marginBottom: 15

                        }}

                    >

                        <h4
                            style={{
                                marginTop: 0
                            }}
                        >

                            {med.name}

                        </h4>

                        <div>

                            <strong>

                                Dosage:

                            </strong>

                            {" "}

                            {med.dosage || "-"}

                        </div>

                        <div>

                            <strong>

                                Frequency:

                            </strong>

                            {" "}

                            {med.frequency || "-"}

                        </div>

                        <div>

                            <strong>

                                Duration:

                            </strong>

                            {" "}

                            {med.duration || "-"}

                        </div>

                        <div>

                            <strong>

                                Quantity:

                            </strong>

                            {" "}

                            {med.quantity || "-"}

                        </div>

                        {

                            med.instructions &&

                            <div
                                style={{
                                    marginTop: 8
                                }}
                            >

                                <strong>

                                    Instructions

                                </strong>

                                <br />

                                {med.instructions}

                            </div>

                        }

                    </div>

                ))

            }



            <hr />



            {/* ======================================
                    DOCTOR NOTES
            ======================================= */}

            <h3>

                Doctor Notes

            </h3>

            <div

                style={{

                    background: "#f8f8f8",

                    padding: 15,

                    borderRadius: 8,

                    minHeight: 70,

                    marginBottom: 20

                }}

            >

                {

                    prescription.pharmacist_note ||

                    "No notes supplied."

                }

            </div>



            <hr />



            {/* ======================================
                    BILLING
            ======================================= */}

            <h3>

                Billing Summary

            </h3>

            <table
                style={{
                    width: "100%"
                }}
            >

                <tbody>

                    <tr>

                        <td>

                            Medication Items

                        </td>

                        <td>

                            {medications.length}

                        </td>

                    </tr>

                    <tr>

                        <td>

                            Insurance

                        </td>

                        <td>

                            {

                                prescription.patient?.insurance

                                    ? "Yes"

                                    : "No"

                            }

                        </td>

                    </tr>

                    <tr>

                        <td>

                            Estimated Total

                        </td>

                        <td>

                            <strong>

                                R

                                {Number(
                                    estimatedBill
                                ).toFixed(2)}

                            </strong>

                        </td>

                    </tr>

                </tbody>

            </table>
            <hr />

            {/* ======================================
                    ACTIONS
            ======================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 25
                }}
            >

                <div>

                    <strong>Status:</strong>{" "}

                    {prescription.status}

                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 10
                    }}
                >

                    <button

                        style={{

                            ...buttonPrimary

                        }}

                        disabled={
                            dispensingId === prescription.id
                        }

                        onClick={() =>
                            onPrepare(
                                prescription
                            )
                        }

                    >

                        {

                            dispensingId === prescription.id

                                ? "Preparing..."

                                : "Prepare Medication"

                        }

                    </button>

                    <button

                        onClick={onClose}

                        style={{

                            padding: "10px 18px",

                            border: "1px solid #ccc",

                            borderRadius: 6,

                            cursor: "pointer"

                        }}

                    >

                        Close

                    </button>

                </div>

            </div>

        </div>

    );

      }
