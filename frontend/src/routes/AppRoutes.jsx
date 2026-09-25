import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import SystemTestPage from '../pages/SystemTestPage';
import NotFoundPage from '../pages/NotFoundPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Dashboard Pages
import PatientDashboard from '../pages/dashboards/PatientDashboard';
import HealthcareDashboard from '../pages/dashboards/HealthcareDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';

// Guards
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleRoute from '../components/auth/RoleRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/system-test" element={<SystemTestPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient / Family Protected Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </RoleRoute>
          }
        />
        <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />

        {/* Healthcare Worker Protected Routes */}
        <Route
          path="/healthcare/dashboard"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER']}>
              <HealthcareDashboard />
            </RoleRoute>
          }
        />
        <Route path="/healthcare" element={<Navigate to="/healthcare/dashboard" replace />} />

        {/* Administrator Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
