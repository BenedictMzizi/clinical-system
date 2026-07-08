import React from "react";

import {
    container,
    header,
    messageError,
    messageInfo
} from "../styles/styles";

import usePharmacy from "../hooks/usePharmacy";

import DashboardCards from "../components/pharmacy/DashboardCards";
import SearchBar from "../components/pharmacy/SearchBar";
import PendingPrescriptionCard from "../components/pharmacy/PendingPrescriptionCard";
import ReadyPrescriptionCard from "../components/pharmacy/ReadyPrescriptionCard";
import PrescriptionModal from "../components/pharmacy/PrescriptionModal";

export default function Pharmacy() {

    const {

        loading,
        error,

        search,
        setSearch,

        filteredPrescriptions,
        readyPrescriptions,

        selectedPrescription,
        setSelectedPrescription,

        dispensingId,

        prepareMedication,
        confirmCollection

    } = usePharmacy();


    if (loading)
        return (
            <div style={container}>
                <h1 style={header}>Pharmacy Queue</h1>

                <div style={messageInfo}>
                    Loading...
                </div>
            </div>
        );


    return (

        <div style={container}>

            <h1 style={header}>
                Pharmacy Queue
            </h1>

            <DashboardCards
                pending={filteredPrescriptions.length}
                ready={readyPrescriptions.length}
            />

            <SearchBar
                search={search}
                setSearch={setSearch}
            />

            {error &&
                <div style={messageError}>
                    {error}
                </div>
            }

            {filteredPrescriptions.length === 0 ?

                <div style={messageInfo}>
                    No prescriptions pending
                </div>

                :

                filteredPrescriptions.map(p => (

                    <PendingPrescriptionCard

                        key={p.id}

                        prescription={p}

                        dispensingId={dispensingId}

                        onView={() =>
                            setSelectedPrescription(p)
                        }

                    />

                ))

            }

            <PrescriptionModal

                prescription={selectedPrescription}

                dispensingId={dispensingId}

                onPrepare={prepareMedication}

                onClose={() =>
                    setSelectedPrescription(null)
                }

            />

            <hr style={{ margin: "30px 0" }} />

            <h2>
                Ready For Collection
            </h2>

            {

                readyPrescriptions.length === 0 ?

                    <div style={messageInfo}>
                        No medication ready for collection
                    </div>

                    :

                    readyPrescriptions.map(p => (

                        <ReadyPrescriptionCard

                            key={p.id}

                            prescription={p}

                            onCollect={confirmCollection}

                        />

                    ))

            }

        </div>

    );

}
