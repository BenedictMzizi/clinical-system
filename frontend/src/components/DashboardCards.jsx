import React from "react";

import { card } from "../../styles/styles";

export default function DashboardCards({

    pending,

    ready

}){

    return(

        <div
            style={{

                display:"flex",

                gap:15,

                marginBottom:20

            }}
        >

            <div
                style={{

                    ...card,

                    flex:1,

                    textAlign:"center"

                }}
            >

                <h3>Pending</h3>

                <h2>{pending}</h2>

            </div>

            <div
                style={{

                    ...card,

                    flex:1,

                    textAlign:"center"

                }}
            >

                <h3>Ready</h3>

                <h2>{ready}</h2>

            </div>

        </div>

    );

}
