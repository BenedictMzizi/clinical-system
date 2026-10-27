import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getOutstandingBills, markPaid } from "../services/billing/billingService";
import { container, header, card, buttonPrimary, messageError, messageInfo, messageSuccess } from "../styles/styles";

const money = (value) => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Billing() {
  const [billing, setBilling] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("Your session has expired. Please sign in again.");
        const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileError) throw profileError;
        if (!data?.practice_id) throw new Error("Your staff profile is not assigned to a clinic or hospital. Ask an administrator to assign your facility.");
        if (!mounted) return;
        setProfile(data);
        const bills = await getOutstandingBills(data.practice_id);
        if (mounted) setBilling(bills);
      } catch (err) {
        if (mounted) setError(err?.message || "Unable to load billing.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredBilling = useMemo(() => {
    const term = search.trim().toLowerCase();
    return billing.filter((bill) => {
      const patient = bill.patient?.full_name?.toLowerCase() || "";
      const idNumber = bill.patient?.id_number || "";
      return !term || patient.includes(term) || idNumber.toLowerCase().includes(term);
    });
  }, [billing, search]);

  const totalPending = useMemo(() => billing.reduce((sum, bill) => sum + Number(bill.amount || 0), 0), [billing]);
  const changeDue = Number(amountReceived) - Number(selectedBill?.amount || 0);

  async function processPayment(event) {
    event?.preventDefault();
    if (!selectedBill || !profile || processing) return;
    setError(null);
    setSuccess(null);
    const received = Number(amountReceived);
    const due = Number(selectedBill.amount);
    if (!amountReceived.trim() || !Number.isFinite(received) || received <= 0) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }
    if (received + 0.000001 < due) {
      setError(`Insufficient payment. The amount due is ${money(due)}.`);
      return;
    }
    setProcessing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Your session has expired. Please sign in again.");
      await markPaid(selectedBill.id, user.id, paymentMethod, paymentReference.trim() || null, received, Math.max(0, Math.round((received - due + Number.EPSILON) * 100) / 100));

      // Audit failure must not imply that a completed payment failed; show a separate warning.
      let auditWarning = "";
      const { error: auditError } = await supabase.from("audit_logs").insert({
        practice_id: profile.practice_id,
        actor_id: user.id,
        action: "PAYMENT_RECEIVED",
        entity: "billing",
        entity_id: selectedBill.id,
        created_at: new Date().toISOString(),
      });
      if (auditError) {
        console.error("Payment saved, but audit entry could not be saved:", auditError);
        auditWarning = " Payment was saved, but the audit entry could not be recorded; notify your administrator.";
      }

      setSuccess(`Payment recorded successfully. Change due: ${money(Math.max(0, received - due))}.${auditWarning}`);
      setSelectedBill(null);
      setAmountReceived("");
      setPaymentReference("");
      setPaymentMethod("Cash");
      try {
        const refreshedBills = await getOutstandingBills(profile.practice_id);
        setBilling(refreshedBills);
      } catch (refreshError) {
        console.error("Payment recorded; billing queue refresh failed:", refreshError);
        setError("Payment was recorded, but the queue could not refresh. Reload the page before processing another payment.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to process payment. No success has been reported.");
    } finally {
      setProcessing(false);
    }
  }

  function openPayment(bill) {
    setSelectedBill(bill);
    setAmountReceived(String(Number(bill.amount || 0).toFixed(2)));
    setPaymentMethod("Cash");
    setPaymentReference("");
    setError(null);
    setSuccess(null);
  }

  if (loading) return <div style={container}>Loading billing queue…</div>;

  return (
    <div style={container}>
      <h1 style={header}>Billing &amp; Payments</h1>
      {error && <div style={messageError} role="alert">{error}</div>}
      {success && <div style={messageSuccess} role="status">{success}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 15, marginBottom: 20 }}>
        <div style={{ ...card, flex: "1 1 180px", textAlign: "center" }}>
          <h3>Pending Bills</h3><h2>{billing.length}</h2>
        </div>
        <div style={{ ...card, flex: "1 1 180px", textAlign: "center" }}>
          <h3>Total Outstanding</h3><h2>{money(totalPending)}</h2>
        </div>
      </div>

      <input
        type="search"
        aria-label="Search patient by name or ID"
        placeholder="Search patient name or ID…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: 12, marginBottom: 20, borderRadius: 8 }}
      />

      {filteredBilling.length === 0 && <div style={messageInfo}>{billing.length ? "No bills match your search." : "No pending payments for this facility."}</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {filteredBilling.map((bill) => (
          <div key={bill.id} style={card}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <strong>{bill.patient?.full_name || "Unknown patient"}</strong>
                <div>{bill.patient?.id_number || "Patient ID unavailable"}</div>
                {bill.description && <div>{bill.description}</div>}
                <div style={{ marginTop: 6 }}>Amount due: <strong>{money(bill.amount)}</strong></div>
              </div>
              <button type="button" style={buttonPrimary} onClick={() => openPayment(bill)}>Process payment</button>
            </div>
          </div>
        ))}
      </div>

      {selectedBill && (
        <form onSubmit={processPayment} style={{ ...card, marginTop: 20, border: "2px solid #1E92D2" }}>
          <h2>Record payment</h2>
          <p><strong>Patient:</strong> {selectedBill.patient?.full_name || "Unknown patient"}</p>
          <p><strong>Amount due:</strong> {money(selectedBill.amount)}</p>
          <label style={{ display: "block", marginBottom: 6 }} htmlFor="payment-method">Payment method</label>
          <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12 }}>
            <option>Cash</option><option>Card</option><option>EFT</option><option>Medical Aid</option><option>Other</option>
          </select>
          <label style={{ display: "block", marginBottom: 6 }} htmlFor="amount-received">Amount received (ZAR)</label>
          <input id="amount-received" type="number" min="0.01" step="0.01" required value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 10, marginBottom: 12 }} />
          <label style={{ display: "block", marginBottom: 6 }} htmlFor="payment-reference">Payment reference (optional)</label>
          <input id="payment-reference" type="text" maxLength={120} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Receipt, EFT or card reference" style={{ width: "100%", boxSizing: "border-box", padding: 10, marginBottom: 12 }} />
          {amountReceived !== "" && Number.isFinite(changeDue) && changeDue >= 0 && <p>Change due: <strong>{money(changeDue)}</strong></p>}
          {amountReceived !== "" && Number.isFinite(changeDue) && changeDue < 0 && <p style={{ color: "#b42318" }}>Short by {money(Math.abs(changeDue))}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="submit" style={{ ...buttonPrimary, opacity: processing ? 0.65 : 1 }} disabled={processing}>{processing ? "Recording payment…" : "Confirm payment"}</button>
            <button type="button" disabled={processing} onClick={() => { setSelectedBill(null); setError(null); }} style={{ padding: "10px 16px" }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
