import React from "react";

import {

    card,

    buttonPrimary

} from "../../styles/styles";

import {

    formatMedications

} from "../../utils/medicationUtils";

export default function ReadyPrescriptionCard({

    prescription,

    onCollect

}){

    return(

        <div

            style={{

                ...card,

                border:"2px solid green"

            }}

        >

            <strong>

                {

                    prescription.patient?.full_name

                }

            </strong>

            <div>

                {

                    prescription.patient?.id_number

                }

            </div>

            <div style={{marginTop:10}}>

                {

                    formatMedications(

                        prescription.medications

                    )

                }

            </div>

            <button

                style={{

                    ...buttonPrimary,

                    marginTop:15

                }}

                onClick={()=>

                    onCollect(

                        prescription

                    )

                }

            >

                Hand To Patient

            </button>

        </div>

    );

}
