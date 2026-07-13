import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import { BillingStatus } from "../constants/billingStatus";

import {
globalUpdate,
globalInsert,
globalSelect
} from "../lib/globalDataLayer";

import {
container,
header,
card,
buttonPrimary,
messageError,
messageInfo,
messageSuccess
} from "../styles/styles";

export default function Billing() {

const [billing, setBilling] = useState([]);
const [selectedBill, setSelectedBill] = useState(null);

const [profile, setProfile] = useState(null);

const [loading, setLoading] = useState(true);

const [search, setSearch] = useState("");

const [paymentMethod, setPaymentMethod] =
useState("Cash");

const [amountReceived, setAmountReceived] =
useState("");

const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);

async function loadProfile() {

```
const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) return;

const profileData =
  await globalSelect(
    "profiles",
    query =>
      query
        .select("*")
        .eq("id", user.id)
        .single()
  );

setProfile(profileData);
```

}

async function loadBilling() {

```
if (!profile?.practice_id) return;

setLoading(true);

try {

  const { data, error } =
    await supabase
      .from("billing")
      .select(`*,
  patient:patients(
          id,
          full_name,
          id_number)`)
      .eq( "status", BillingStatus.PENDING)
      .eq(
        "practice_id",
        profile.practice_id
      )
      .order(
        "created_at",
        { ascending: true }
      );

  if (error) throw error;

  setBilling(data || []);

}
catch (err) {

  console.error(err);

  setError(
    "Failed to load billing queue"
  );

}

setLoading(false);

}

async function processPayment() {


if (!selectedBill) return;

try {

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user)
    throw new Error(
      "Not authenticated"
    );

  const paid =
    Number(amountReceived);

  if (paid < selectedBill.amount)
    throw new Error(
      "Insufficient payment"
    );

  const change =
    paid - selectedBill.amount;

  await globalUpdate(
    "billing",
    { id: selectedBill.id },
    {
      status: BillingStatus.PAID,
      payment_method: paymentMethod,
      paid_amount: paid,
      change_amount: change,
      paid_by: user.id,
      paid_at:
        new Date().toISOString()
    }
  );

  await globalInsert(
    "audit_logs",
    {
      practice_id:
        profile.practice_id,

      actor_id: user.id,

      action: "PAYMENT_RECEIVED",

      entity: "billing",

      entity_id:
        selectedBill.id,

      created_at:
        new Date().toISOString()
    }
  );

  setSuccess(
    "Payment processed successfully"
  );

  setSelectedBill(null);

  setAmountReceived("");

  loadBilling();

}
catch (err) {

  console.error(err);

  setError(
    err.message ||
    "Payment failed"
  );

}
```

}

useEffect(() => {

```
loadProfile();
```

}, []);

useEffect(() => {

```
if (!profile) return;

loadBilling();
```

}, [profile]);

const filteredBilling =
billing.filter(b => {

```
  const patient =
    b.patient?.full_name
      ?.toLowerCase() || "";

  const idNumber =
    b.patient?.id_number || "";

  return (
    patient.includes(
      search.toLowerCase()
    ) ||
    idNumber.includes(search)
  );

});
```

const totalPending =
billing.reduce(
(sum, bill) =>
sum + Number(bill.amount || 0),
0
);

if (loading)
return ( <div style={container}>
Loading Billing... </div>
);

return (

```
<div style={container}>

  <h1 style={header}>
    Billing & Payments
  </h1>

  {error &&
    <div style={messageError}>
      {error}
    </div>
  }

  {success &&
    <div style={messageSuccess}>
      {success}
    </div>
  }

  <div
    style={{
      display: "flex",
      gap: "15px",
      marginBottom: "20px"
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
      <h2>
        {billing.length}
      </h2>
    </div>

    <div
      style={{
        ...card,
        flex: 1,
        textAlign: "center"
      }}
    >
      <h3>Total Due</h3>
      <h2>
        R{totalPending}
      </h2>
    </div>

  </div>

  <input
    type="text"
    placeholder="Search patient name or ID..."
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    style={{
      width: "100%",
      padding: "12px",
      marginBottom: "20px",
      borderRadius: "8px"
    }}
  />

  {filteredBilling.length === 0 && (

    <div style={messageInfo}>
      No pending payments
    </div>

  )}

  {filteredBilling.map(bill => (

    <div
      key={bill.id}
      style={card}
    >

      <strong>
        {bill.patient?.full_name}
      </strong>

      <div>
        {bill.patient?.id_number}
      </div>

      <div>
        Amount Due:
        {" "}
        R{bill.amount}
      </div>

      <button
        style={{
          ...buttonPrimary,
          marginTop: 10
        }}
        onClick={() =>
          setSelectedBill(bill)
        }
      >
        Process Payment
      </button>

    </div>

  ))}

  {selectedBill && (

    <div
      style={{
        ...card,
        marginTop: 20,
        border:
          "2px solid green"
      }}
    >

      <h2>Payment</h2>

      <p>
        <strong>Patient:</strong>
        {" "}
        {
          selectedBill.patient
            ?.full_name
        }
      </p>

      <p>
        <strong>Total:</strong>
        {" "}
        R{selectedBill.amount}
      </p>

      <select
        value={paymentMethod}
        onChange={(e) =>
          setPaymentMethod(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px"
        }}
      >
        <option>Cash</option>
        <option>Card</option>
        <option>EFT</option>
      </select>

      <input
        type="number"
        placeholder="Amount Received"
        value={amountReceived}
        onChange={(e) =>
          setAmountReceived(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px"
        }}
      />

      <button
        style={buttonPrimary}
        onClick={processPayment}
      >
        Confirm Payment
      </button>

    </div>

  )}

</div>
```

);

}
