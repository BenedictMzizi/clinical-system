import React, { useMemo } from "react";

import {
    card,
    buttonPrimary
} from "../../styles/styles";

export default function PaymentModal({

    bill,

    paymentMethod,

    setPaymentMethod,

    amountReceived,

    setAmountReceived,

    processing = false,

    onConfirm,

    onClose

}) {

    const amountDue = Number(
        bill?.amount || 0
    );

    const paidAmount = Number(
        amountReceived || 0
    );

    const change = useMemo(() => {

        if (paidAmount < amountDue)
            return 0;

        return paidAmount - amountDue;

    }, [

        paidAmount,

        amountDue

    ]);



    if (!bill)
        return null;



    return (

        <div

            style={{

                position: "fixed",

                inset: 0,

                background: "rgba(0,0,0,.45)",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                zIndex: 9999

            }}

        >

            <div

                style={{

                    ...card,

                    width: "90%",

                    maxWidth: 650,

                    maxHeight: "90vh",

                    overflowY: "auto"

                }}

            >

                <h2>

                    Process Payment

                </h2>

                <hr />



                <h3>

                    Patient Details

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

                                <strong>Name</strong>

                            </td>

                            <td>

                                {bill.patient?.full_name}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                <strong>ID Number</strong>

                            </td>

                            <td>

                                {bill.patient?.id_number}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                <strong>Bill ID</strong>

                            </td>

                            <td>

                                {bill.id}

                            </td>

                        </tr>

                    </tbody>

                </table>

                <hr />

                <h3>

                    Billing Summary

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

                                Amount Due

                            </td>

                            <td>

                                <strong>

                                    R{amountDue.toFixed(2)}

                                </strong>

                            </td>

                        </tr>

                        <tr>

                            <td>

                                Status

                            </td>

                            <td>

                                {bill.status}

                            </td>

                        </tr>

                        {

                            bill.receipt_number &&

                            <tr>

                                <td>

                                    Receipt

                                </td>

                                <td>

                                    {bill.receipt_number}

                                </td>

                            </tr>

                        }

                    </tbody>

                </table>

                <hr />

                <h3>

                    Payment

                </h3>

                <label>

                    Payment Method

                </label>

                <select

                    value={paymentMethod}

                    onChange={(e)=>

                        setPaymentMethod(

                            e.target.value

                        )

                    }

                    style={{

                        width:"100%",

                        padding:10,

                        marginTop:8,

                        marginBottom:15

                    }}

                >

                    <option>

                        Cash

                    </option>

                    <option>

                        Card

                    </option>

                    <option>

                        EFT

                    </option>

                    <option>

                        Medical Aid

                    </option>

                </select>

                <label>

                    Amount Received

                </label>

                <input

                    type="number"

                    value={amountReceived}

                    onChange={(e)=>

                        setAmountReceived(

                            e.target.value

                        )

                    }

                    placeholder="0.00"

                    style={{

                        width:"100%",

                        padding:10,

                        marginTop:8,

                        marginBottom:20

                    }}

                />

                <table
                    style={{
                        width: "100%"
                    }}
                >

                    <tbody>

                        <tr>

                            <td>

                                Amount Due

                            </td>

                            <td>

                                R{amountDue.toFixed(2)}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                Received

                            </td>

                            <td>

                                R{paidAmount.toFixed(2)}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                Change

                            </td>

                            <td>

                                <strong>

                                    R{change.toFixed(2)}

                                </strong>

                            </td>

                        </tr>

                    </tbody>

                </table>
                              <hr />

                {/* ======================================
                        VALIDATION
                ======================================= */}

                {

                    paidAmount > 0 &&

                    paidAmount < amountDue &&

                    <div
                        style={{
                            padding: 12,
                            marginTop: 15,
                            marginBottom: 15,
                            borderRadius: 6,
                            background: "#fff3cd",
                            color: "#856404",
                            border: "1px solid #ffeeba"
                        }}
                    >

                        Amount received is less than the amount due.

                    </div>

                }

                {

                    paidAmount >= amountDue &&

                    amountDue > 0 &&

                    <div
                        style={{
                            padding: 12,
                            marginTop: 15,
                            marginBottom: 15,
                            borderRadius: 6,
                            background: "#d4edda",
                            color: "#155724",
                            border: "1px solid #c3e6cb"
                        }}
                    >

                        Payment is sufficient.

                    </div>

                }

                <hr />

                {/* ======================================
                        ACTION BUTTONS
                ======================================= */}

                <div

                    style={{

                        display: "flex",

                        justifyContent: "flex-end",

                        gap: 12,

                        marginTop: 20

                    }}

                >

                    <button

                        onClick={onClose}

                        disabled={processing}

                        style={{

                            padding: "10px 18px",

                            borderRadius: 6,

                            border: "1px solid #ccc",

                            cursor: processing
                                ? "not-allowed"
                                : "pointer"

                        }}

                    >

                        Cancel

                    </button>

                    <button

                        style={buttonPrimary}

                        disabled={

                            processing ||

                            paidAmount < amountDue ||

                            amountDue <= 0

                        }

                        onClick={onConfirm}

                    >

                        {

                            processing

                                ? "Processing..."

                                : "Confirm Payment"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}
