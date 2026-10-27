import { supabase } from "../../lib/supabase";
import { BillingStatus } from "../../constants/billingStatus";
import { getServicePrice } from "../pricing/pricingService";

function requireId(value, label) {
  if (!value) throw new Error(`${label} is required.`);
}

function toMoney(value, label = "Amount") {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${label} is required.`);
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be a valid non-negative amount.`);
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated.");
  return user;
}

export async function billingExists(prescriptionId) {
  requireId(prescriptionId, "Prescription");
  const { data, error } = await supabase
    .from("billing")
    .select("id")
    .eq("prescription_id", prescriptionId)
    .limit(1);
  if (error) throw error;
  return (data || []).length > 0;
}

export async function getBillingByPrescription(prescriptionId) {
  requireId(prescriptionId, "Prescription");
  const { data, error } = await supabase
    .from("billing")
    .select("*")
    .eq("prescription_id", prescriptionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBilling(billingId) {
  requireId(billingId, "Bill");
  const { data, error } = await supabase
    .from("billing")
    .select("*")
    .eq("id", billingId)
    .single();
  if (error) throw error;
  return data;
}

export async function getPatientBilling(patientId) {
  requireId(patientId, "Patient");
  const { data, error } = await supabase
    .from("billing")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

function parseMedicationList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Prices one unit per prescribed medication. Configure MEDICATION_ITEM in service_pricing. */
export async function calculateMedicationBill(prescription, practiceId = prescription?.practice_id) {
  if (!prescription) throw new Error("Prescription is required.");
  requireId(practiceId, "Practice");
  const medications = parseMedicationList(prescription.medications);
  if (!medications.length) return 0;
  const itemPrice = await getServicePrice(practiceId, "MEDICATION_ITEM");
  return toMoney(medications.length * itemPrice);
}

export async function calculateConsultationBill(practiceId) {
  requireId(practiceId, "Practice");
  return toMoney(await getServicePrice(practiceId, "CONSULTATION"));
}

export function calculateLabBill(tests = []) {
  if (!Array.isArray(tests)) throw new Error("Tests must be a list.");
  return toMoney(tests.reduce((total, test) => total + toMoney(test?.price ?? 0, "Test price"), 0));
}

export async function createBilling({
  practiceId,
  prescriptionId = null,
  visitId = null,
  patientId,
  amount,
  status = BillingStatus.PENDING,
  description = "",
  createdBy,
}) {
  requireId(practiceId, "Practice");
  requireId(patientId, "Patient");
  const billAmount = toMoney(amount);
  if (![BillingStatus.PENDING, BillingStatus.PAID].includes(status)) {
    throw new Error("Unsupported initial billing status.");
  }
  if (status === BillingStatus.PAID) {
    throw new Error("Create a bill as pending, then record payment through markPaid.");
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("billing")
    .insert({
      practice_id: practiceId,
      prescription_id: prescriptionId,
      visit_id: visitId,
      patient_id: patientId,
      amount: billAmount,
      status,
      description,
      created_by: createdBy || null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateBillAmount(billingId, amount) {
  requireId(billingId, "Bill");
  const billAmount = toMoney(amount);
  const { data, error } = await supabase
    .from("billing")
    .update({ amount: billAmount, updated_at: new Date().toISOString() })
    .eq("id", billingId)
    .eq("status", BillingStatus.PENDING)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markPending(billingId) {
  requireId(billingId, "Bill");
  const { data, error } = await supabase
    .from("billing")
    .update({ status: BillingStatus.PENDING, updated_at: new Date().toISOString() })
    .eq("id", billingId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Records a full payment on the existing billing row. Partial payments need a payment-ledger migration first. */
export async function markPaid(
  billingId,
  paidBy,
  paymentMethod,
  paymentReference = null,
  paidAmount,
  changeAmount = 0,
) {
  requireId(billingId, "Bill");
  requireId(paidBy, "Cashier");
  if (!paymentMethod || !["Cash", "Card", "EFT", "Medical Aid", "Other"].includes(paymentMethod)) {
    throw new Error("Choose a valid payment method.");
  }
  const received = toMoney(paidAmount, "Amount received");
  const change = toMoney(changeAmount, "Change");
  if (received <= 0) throw new Error("Payment must be greater than zero.");

  const bill = await getBilling(billingId);
  if (bill.status !== BillingStatus.PENDING) {
    throw new Error("This bill is no longer pending payment. Refresh the queue and try again.");
  }
  const due = toMoney(bill.amount, "Bill amount");
  if (received < due) throw new Error("Payment is less than the amount due.");
  if (Math.abs((received - due) - change) > 0.01) {
    throw new Error("The calculated change does not match the payment amount.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("billing")
    .update({
      status: BillingStatus.PAID,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      paid_amount: received,
      change_amount: change,
      paid_by: paidBy,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", billingId)
    .eq("status", BillingStatus.PENDING)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Payment was not saved. Refresh the queue and try again.");
  return data;
}

export async function cancelBill(billingId, reason = "") {
  requireId(billingId, "Bill");
  const { data, error } = await supabase
    .from("billing")
    .update({ status: BillingStatus.CANCELLED, cancellation_reason: reason, cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", billingId)
    .eq("status", BillingStatus.PENDING)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function refundBill(billingId, refundedBy, reason = "") {
  requireId(billingId, "Bill");
  requireId(refundedBy, "Refunding staff member");
  const { data, error } = await supabase
    .from("billing")
    .update({ status: BillingStatus.REFUNDED, refunded_by: refundedBy, refund_reason: reason, refunded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", billingId)
    .eq("status", BillingStatus.PAID)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

const BILL_SELECT = `*, patient:patients(id, full_name, id_number)`;

export async function getBillsByPractice(practiceId) {
  requireId(practiceId, "Practice");
  const { data, error } = await supabase.from("billing").select(BILL_SELECT).eq("practice_id", practiceId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOutstandingBills(practiceId) {
  requireId(practiceId, "Practice");
  const { data, error } = await supabase.from("billing").select(BILL_SELECT).eq("practice_id", practiceId).eq("status", BillingStatus.PENDING).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPaidBills(practiceId) {
  requireId(practiceId, "Practice");
  const { data, error } = await supabase.from("billing").select(BILL_SELECT).eq("practice_id", practiceId).eq("status", BillingStatus.PAID).order("paid_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getBillsByDateRange(practiceId, startDate, endDate) {
  requireId(practiceId, "Practice");
  if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) throw new Error("A valid date range is required.");
  const { data, error } = await supabase.from("billing").select(BILL_SELECT).eq("practice_id", practiceId).gte("created_at", startDate).lte("created_at", endDate).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function getBillingSummary(bills = []) {
  return bills.reduce((summary, bill) => {
    const amount = Number(bill.amount || 0);
    summary.totalBills += 1;
    if (bill.status === BillingStatus.PAID) { summary.paidBills += 1; summary.totalRevenue += amount; }
    else if (bill.status === BillingStatus.PENDING) { summary.pendingBills += 1; summary.outstandingAmount += amount; }
    else if (bill.status === BillingStatus.CANCELLED) summary.cancelledBills += 1;
    else if (bill.status === BillingStatus.REFUNDED) summary.refundedBills += 1;
    return summary;
  }, { totalBills: 0, pendingBills: 0, paidBills: 0, cancelledBills: 0, refundedBills: 0, totalRevenue: 0, outstandingAmount: 0 });
}

export async function deleteBill(billingId) {
  requireId(billingId, "Bill");
  const { error } = await supabase.from("billing").delete().eq("id", billingId).eq("status", BillingStatus.PENDING);
  if (error) throw error;
}

export function validateBilling({ patientId, amount }) {
  requireId(patientId, "Patient");
  toMoney(amount);
  return true;
}
