import React from "react";

export default function SearchBar({

    search,

    setSearch

}){

    return(

        <input

            type="text"

            placeholder="Search patient name or ID..."

            value={search}

            onChange={

                e=>setSearch(

                    e.target.value

                )

            }

            style={{

                width:"100%",

                padding:"12px",

                marginBottom:"20px",

                borderRadius:"8px",

                border:"1px solid #ccc"

            }}

        />

    );

}
