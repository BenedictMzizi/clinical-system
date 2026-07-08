import { useState, useEffect, useMemo } from "react";

import {
  loadProfile,
  getPendingPrescriptions,
  getReadyPrescriptions,
} from "../services/pharmacyService";

export default function usePharmacy() {

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  const [prescriptions, setPrescriptions] = useState([]);

  const [readyPrescriptions, setReadyPrescriptions] = useState([]);

  const [selectedPrescription, setSelectedPrescription] =
    useState(null);

  const [dispensingId, setDispensingId] =
    useState(null);



  //--------------------------------------------------
  // Load Logged In User Profile
  //--------------------------------------------------

  async function fetchProfile() {

    try {

      setError(null);

      const profileData =
        await loadProfile();

      setProfile(profileData);

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load profile"
      );

    }

  }



  //--------------------------------------------------
  // Load Pending Prescriptions
  //--------------------------------------------------

  async function fetchPendingPrescriptions() {

    if (!profile?.practice_id)
      return;

    try {

      const data =
        await getPendingPrescriptions(
          profile.practice_id
        );

      setPrescriptions(data);

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load prescriptions"
      );

    }

  }



  //--------------------------------------------------
  // Load Ready Prescriptions
  //--------------------------------------------------

  async function fetchReadyPrescriptions() {

    if (!profile?.practice_id)
      return;

    try {

      const data =
        await getReadyPrescriptions(
          profile.practice_id
        );

      setReadyPrescriptions(data);

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load ready prescriptions"
      );

    }

  }



  //--------------------------------------------------
  // Refresh Everything
  //--------------------------------------------------

  async function refreshData() {

    if (!profile?.practice_id)
      return;

    setLoading(true);

    try {

      await Promise.all([

        fetchPendingPrescriptions(),

        fetchReadyPrescriptions()

      ]);

    } finally {

      setLoading(false);

    }

  }



  //--------------------------------------------------
  // Search Filter
  //--------------------------------------------------

  const filteredPrescriptions =
    useMemo(() => {

      const term =
        search.toLowerCase();

      return prescriptions.filter(p => {

        const patientName =
          p.patient?.full_name
            ?.toLowerCase() || "";

        const idNumber =
          p.patient?.id_number || "";

        return (

          patientName.includes(term)

          ||

          idNumber.includes(search)

        );

      });

    }, [

      prescriptions,

      search

    ]);



  //--------------------------------------------------
  // Initial Load
  //--------------------------------------------------

  useEffect(() => {

    fetchProfile();

  }, []);



  //--------------------------------------------------
  // Load Queue Once Profile Exists
  //--------------------------------------------------

  useEffect(() => {

    if (!profile)
      return;

    refreshData();

  }, [

    profile

  ]);



  //--------------------------------------------------
  // Auto Refresh Every Minute
  //--------------------------------------------------

  useEffect(() => {

    if (!profile)
      return;

    const interval =
      setInterval(() => {

        refreshData();

      }, 60000);

    return () =>
      clearInterval(interval);

  }, [

    profile

  ]);



  return {

    loading,

    error,

    profile,

    search,

    setSearch,

    prescriptions,

    filteredPrescriptions,

    readyPrescriptions,

    selectedPrescription,

    setSelectedPrescription,

    dispensingId,

    setDispensingId,

    refreshData

    //--------------------------------------------------
// Prepare Medication
//--------------------------------------------------

async function prepareMedication(prescription) {

  if (dispensingId)
    return;

  setDispensingId(prescription.id);

  setError(null);

  try {

    await prepareMedicationService(

      prescription,

      profile

    );

    setSelectedPrescription(null);

    await refreshData();

  } catch (err) {

    console.error(err);

    setError(

      err.message ||

      "Failed to prepare medication"

    );

  } finally {

    setDispensingId(null);

  }

}



 //--------------------------------------------------
 // Confirm Collection
 //--------------------------------------------------

 async function confirmCollection(prescription) {

  setError(null);

  try {

    await confirmCollectionService(

      prescription,

      profile

    );

    await refreshData();

  } catch (err) {

    console.error(err);

    setError(

      err.message ||

      "Failed to hand medication to patient"

    );

  }

}



 //--------------------------------------------------
 // Refresh Helper
 //--------------------------------------------------

 async function refreshQueue() {

  await refreshData();

 }



 //--------------------------------------------------
 // Return Everything
 //--------------------------------------------------

 return {

  loading,

  error,

  profile,



  // Search

  search,

  setSearch,



  // Pending Queue

  prescriptions,

  filteredPrescriptions,



  // Ready Queue

  readyPrescriptions,



  // Selected Prescription

  selectedPrescription,

  setSelectedPrescription,



  // Preparing

  dispensingId,

  setDispensingId,


  prepareMedication,

  confirmCollection,



  refreshQueue,

  refreshData

 };

}

  };

    }
