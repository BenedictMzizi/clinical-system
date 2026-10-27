import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadProfile,
  getPendingPrescriptions,
  getReadyPrescriptions,
  prepareMedicationService,
  confirmCollectionService,
} from "../services/pharmacyService";

export default function usePharmacy() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [readyPrescriptions, setReadyPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispensingId, setDispensingId] = useState(null);

  const refreshData = useCallback(async () => {
    if (!profile?.practice_id) return;
    setLoading(true);
    setError(null);
    try {
      const [pending, ready] = await Promise.all([
        getPendingPrescriptions(profile.practice_id),
        getReadyPrescriptions(profile.practice_id),
      ]);
      setPrescriptions(pending);
      setReadyPrescriptions(ready);
    } catch (err) {
      setError(err?.message || "Failed to refresh pharmacy queues.");
    } finally {
      setLoading(false);
    }
  }, [profile?.practice_id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profileData = await loadProfile();
        if (active) setProfile(profileData);
      } catch (err) {
        if (active) setError(err?.message || "Failed to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (profile?.practice_id) refreshData();
  }, [profile, refreshData]);

  useEffect(() => {
    if (!profile?.practice_id) return undefined;
    const interval = setInterval(() => refreshData(), 60000);
    return () => clearInterval(interval);
  }, [profile?.practice_id, refreshData]);

  const filteredPrescriptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return prescriptions.filter((p) =>
      (p.patient?.full_name || "").toLowerCase().includes(term) ||
      (p.patient?.id_number || "").toLowerCase().includes(term)
    );
  }, [prescriptions, search]);

  async function prepareMedication(prescription) {
    if (dispensingId) return;
    setDispensingId(prescription.id);
    setError(null);
    try {
      await prepareMedicationService(prescription, profile);
      setSelectedPrescription(null);
      await refreshData();
    } catch (err) {
      setError(err?.message || "Failed to prepare medication.");
    } finally {
      setDispensingId(null);
    }
  }

  async function confirmCollection(prescription) {
    setError(null);
    try {
      await confirmCollectionService(prescription, profile);
      await refreshData();
    } catch (err) {
      setError(err?.message || "Failed to hand medication to patient.");
    }
  }

  return {
    loading, error, profile, search, setSearch, prescriptions, filteredPrescriptions,
    readyPrescriptions, selectedPrescription, setSelectedPrescription, dispensingId,
    setDispensingId, prepareMedication, confirmCollection, refreshQueue: refreshData, refreshData,
  };
}
