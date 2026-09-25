import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import SystemTestPage from '../pages/SystemTestPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/system-test" element={<SystemTestPage />} />
        
        {/* Foundation placeholders for Phase 2 / 5 role-based dashboards */}
        {/* <Route path="/patient/*" element={<PatientDashboard />} /> */}
        {/* <Route path="/clinical/*" element={<HealthcareDashboard />} /> */}
        {/* <Route path="/admin/*" element={<AdminDashboard />} /> */}

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
