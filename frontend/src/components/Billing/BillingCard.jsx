import React from "react";

import {

    card,

    buttonPrimary

} from "../../styles/styles";

export default function BillingCard({

    bill,

    onProcess

}) {

    return (

        <div style={card}>

            <h3>

                {bill.patient?.full_name}

            </h3>

            <p>

                {bill.patient?.id_number}

            </p>

            <p>

                Amount Due

            </p>

            <h2>

                R{Number(bill.amount).toFixed(2)}

            </h2>

            <button

                style={buttonPrimary}

                onClick={() =>
                    onProcess(
                        bill
                    )
                }

            >

                Process Payment

            </button>

        </div>

    );

}
