import React from "react";
import './index.css';

import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Reception from "./pages/Reception";
import Consultant from "./pages/Consultant";
import DoctorConsultation from "./pages/DoctorConsultation";
import Pharmacy from "./pages/Pharmacy";
import ITAdmin from "./pages/ITAdmin";
import Vitals from "./pages/Vitals";

export default function App() {
  return (
    <Routes>

      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Reception */}
      <Route
        path="/reception"
        element={
          <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
            <Layout>
              <Reception />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Doctor Queue (Consultations list) */}
      <Route
        path="/consultant"
        element={
          <ProtectedRoute allowedRoles={["admin", "consultant"]}>
            <Layout>
              <DoctorConsultation />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Individual Consultation Session */}
      <Route
        path="/consultant/:visitId"
        element={
          <ProtectedRoute allowedRoles={["admin", "consultant"]}>
            <Layout>
              <Consultant />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Pharmacy */}
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRoles={["admin", "pharmacist"]}>
            <Layout>
              <Pharmacy />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Nurse */}
      <Route
        path= "/vitals"
        element= {
          <ProtectedRoute allowedRoles={["admin", "nurse"]}>
            <Layout>
              <Vitals/>
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* IT Admin */}
      <Route
        path="/it-admin"
        element={
          <ProtectedRoute allowedRoles={["admin", "it"]}>
            <Layout>
              <ITAdmin />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="*" element={<Login />} />

    </Routes>
  );
}
