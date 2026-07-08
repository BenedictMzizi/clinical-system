import React from "react";

import {

    card,

    buttonPrimary

} from "../../styles/styles";

import {

    medicationCount

} from "../../utils/medicationUtils";

export default function PendingPrescriptionCard({

    prescription,

    dispensingId,

    onView

}){

    return(

        <div

            style={{

                ...card,

                border:

                    dispensingId===prescription.id

                    ? "2px solid green"

                    : undefined

            }}

        >

            <div>

                <strong>

                    {prescription.patient?.full_name}

                </strong>

                {" "}

                {prescription.patient?.id_number}

            </div>

            <div style={{marginTop:10}}>

                <strong>

                    Medication Count

                </strong>

                <br/>

                {

                    medicationCount(

                        prescription.medications

                    )

                }

                {" "}items

            </div>

            <div>

                Created{" "}

                {

                    new Date(

                        prescription.created_at

                    ).toLocaleString()

                }

            </div>

            <button

                style={{

                    ...buttonPrimary,

                    marginTop:10

                }}

                onClick={onView}

            >

                View Prescription

            </button>

        </div>

    );

  }
