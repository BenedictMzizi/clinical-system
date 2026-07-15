import { useEffect, useMemo, useState } from "react";

import { loadProfile } from "../services/profile/profileService";

import {

    getOutstandingBills,

    markPaid

} from "../services/billing/billingService";

import {

    createAuditLog

} from "../services/audit/auditService";


export default function useBilling() {

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [success, setSuccess] = useState(null);

    const [profile, setProfile] = useState(null);

    const [billing, setBilling] = useState([]);

    const [selectedBill, setSelectedBill] = useState(null);

    const [search, setSearch] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const [amountReceived, setAmountReceived] = useState("");


    async function refreshProfile() {

        try {

            const data =

                await loadProfile();

            setProfile(data);

        }

        catch (err) {

            console.error(err);

            setError(

                err.message ||

                "Failed to load profile"

            );

        }

    }


    async function refreshBilling() {

        if (!profile?.practice_id)

            return;

        setLoading(true);

        setError(null);

        try {

            const data =

                await getOutstandingBills(

                    profile.practice_id

                );

            setBilling(data);

        }

        catch (err) {

            console.error(err);

            setError(

                err.message ||

                "Unable to load billing."

            );

        }

        finally {

            setLoading(false);

        }

    }
      

    useEffect(() => {

        refreshProfile();

    }, []);


    useEffect(() => {

        if (profile)

            refreshBilling();

    }, [profile]);



    const filteredBilling =

        useMemo(() => {

            return billing.filter(bill => {

                const patient = bill.patient?.full_name  ?.toLowerCase() || "";

                const idNumber = bill.patient?.id_number || "";

                return (

                    patient.includes( search.toLowerCase())|| idNumber.includes(search) );

            });

        }, [

            billing,

            search

        ]);


    const totalPending =

        useMemo(() =>

            billing.reduce(

                (sum, bill) =>

                    sum +

                    Number(

                        bill.amount || 0

                    ),

                0

            ),

            [billing]

        );
      

    async function processPayment() {

        if (!selectedBill)
            return;

        setError(null);
        setSuccess(null);

        try {

            const paidAmount =
                Number(amountReceived);

            if (Number.isNaN(paidAmount))
                throw new Error(
                    "Enter a valid payment amount."
                );

            if (paidAmount < Number(selectedBill.amount))
                throw new Error(
                    "Insufficient payment."
                );

            const change =
                paidAmount -
                Number(selectedBill.amount);

            await markPaid(

                selectedBill.id,

                profile.id,

                paymentMethod,

                null

            );

            await createAuditLog({

                practiceId:
                    profile.practice_id,

                actorId:
                    profile.id,

                action:
                    "PAYMENT_RECEIVED",

                entity:
                    "billing",

                entityId:
                    selectedBill.id

            });

            setSuccess(

                `Payment successful. Change: R${change.toFixed(2)}`

            );

            setSelectedBill(null);

            setAmountReceived("");

            setPaymentMethod("Cash");

            await refreshBilling();

        }

        catch (err) {

            console.error(err);

            setError(

                err.message ||

                "Unable to process payment."

            );

        }

    }


    function openPayment(bill) {

        setSelectedBill(  bill

        );

        setAmountReceived("");

        setPaymentMethod(

            "Cash"

        );

        setError(null);

        setSuccess(null);

    }



    function closePayment() {

        setSelectedBill(null);

        setAmountReceived("");

        setPaymentMethod("Cash");

    }
