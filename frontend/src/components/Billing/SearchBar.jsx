import React from "react";

export default function SearchBar({

    search,

    setSearch

}) {

    return (

        <input

            type="text"

            placeholder="Search patient..."

            value={search}

            onChange={(e) =>
                setSearch(
                    e.target.value
                )
            }

            style={{

                width: "100%",

                padding: 12,

                borderRadius: 8,

                marginBottom: 20,

                border: "1px solid #ccc"

            }}

        />

    );

}
