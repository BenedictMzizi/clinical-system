import React from "react";

import {
    card
} from "../../styles/styles";

export default function DashboardCards({

    totalBills,

    totalPending

}) {

    return (

        <div
            style={{
                display: "flex",
                gap: 20,
                marginBottom: 20
            }}
        >

            <div
                style={{
                    ...card,
                    flex: 1,
                    textAlign: "center"
                }}
            >

                <h3>Pending Bills</h3>

                <h1>{totalBills}</h1>

            </div>

            <div
                style={{
                    ...card,
                    flex: 1,
                    textAlign: "center"
                }}
            >

                <h3>Total Outstanding</h3>

                <h1>

                    R{Number(totalPending).toFixed(2)}

                </h1>

            </div>

        </div>

    );

  }
