import { supabase } from "../../lib/supabase";

export async function getServicePrice(practiceId, serviceCode) {
  if (!practiceId) throw new Error("Facility is required to look up service pricing.");
  if (!serviceCode) throw new Error("Service code is required.");
  const { data, error } = await supabase
    .from("service_pricing")
    .select("id, practice_id, service_code, service_name, price, active")
    .eq("practice_id", practiceId)
    .eq("service_code", serviceCode)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Price not configured for ${serviceCode}. Ask an administrator to configure pricing for this facility.`);
  const price = Number(data.price);
  if (!Number.isFinite(price) || price < 0) throw new Error(`The configured price for ${serviceCode} is invalid.`);
  return price;
}

export async function getAllPrices(practiceId) {
  if (!practiceId) throw new Error("Facility is required to load service pricing.");
  const { data, error } = await supabase
    .from("service_pricing")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("active", true)
    .order("service_name");
  if (error) throw error;
  return data || [];
}

export async function updatePrice(priceId, newPrice) {
  if (!priceId) throw new Error("Price record is required.");
  const price = Number(newPrice);
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid non-negative amount.");
  const { data, error } = await supabase
    .from("service_pricing")
    .update({ price: Math.round((price + Number.EPSILON) * 100) / 100, updated_at: new Date().toISOString() })
    .eq("id", priceId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
