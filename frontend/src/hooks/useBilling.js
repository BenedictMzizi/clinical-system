import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getOutstandingBills, markPaid } from "../services/billing/billingService";

export default function useBilling() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);
  const [billing, setBilling] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const refreshBilling = useCallback(async (practiceId = profile?.practice_id) => {
    if (!practiceId) return;
    setLoading(true);
    setError(null);
    try {
      setBilling(await getOutstandingBills(practiceId));
    } catch (err) {
      setError(err?.message || "Unable to load billing.");
    } finally {
      setLoading(false);
    }
  }, [profile?.practice_id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("Not authenticated.");
        const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileError) throw profileError;
        if (!data?.practice_id) throw new Error("Your staff profile has no assigned facility.");
        if (!active) return;
        setProfile(data);
        setBilling(await getOutstandingBills(data.practice_id));
      } catch (err) {
        if (active) setError(err?.message || "Failed to load billing.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filteredBilling = useMemo(() => {
    const term = search.trim().toLowerCase();
    return billing.filter((bill) => (bill.patient?.full_name || "").toLowerCase().includes(term) || (bill.patient?.id_number || "").toLowerCase().includes(term));
  }, [billing, search]);

  const totalPending = useMemo(() => billing.reduce((sum, bill) => sum + Number(bill.amount || 0), 0), [billing]);

  async function processPayment() {
    if (!selectedBill || !profile || processing) return;
    setError(null);
    setSuccess(null);
    const received = Number(amountReceived);
    const due = Number(selectedBill.amount);
    if (!amountReceived.trim() || !Number.isFinite(received) || received <= 0) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }
    if (received < due) {
      setError("Insufficient payment.");
      return;
    }
    setProcessing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Not authenticated.");
      await markPaid(selectedBill.id, user.id, paymentMethod, paymentReference.trim() || null, received, Math.round((received - due + Number.EPSILON) * 100) / 100);
      const { error: auditError } = await supabase.from("audit_logs").insert({
        practice_id: profile.practice_id,
        actor_id: user.id,
        action: "PAYMENT_RECEIVED",
        entity: "billing",
        entity_id: selectedBill.id,
        created_at: new Date().toISOString(),
      });
      setSuccess(`Payment recorded. Change: R${Math.max(0, received - due).toFixed(2)}${auditError ? " Audit entry failed; notify your administrator." : ""}`);
      if (auditError) console.error("Payment recorded, audit entry failed:", auditError);
      setSelectedBill(null);
      setAmountReceived("");
      setPaymentReference("");
      setPaymentMethod("Cash");
      try { setBilling(await getOutstandingBills(profile.practice_id)); }
      catch (refreshError) { setError("Payment was recorded, but the queue could not refresh. Reload before processing another payment."); }
    } catch (err) {
      setError(err?.message || "Unable to process payment.");
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

  function closePayment() {
    setSelectedBill(null);
    setAmountReceived("");
    setPaymentReference("");
    setPaymentMethod("Cash");
  }

  return {
    loading, processing, error, setError, success, profile, billing, selectedBill,
    search, setSearch, paymentMethod, setPaymentMethod, amountReceived, setAmountReceived,
    paymentReference, setPaymentReference, filteredBilling, totalPending, refreshBilling,
    processPayment, openPayment, closePayment,
  };
}
