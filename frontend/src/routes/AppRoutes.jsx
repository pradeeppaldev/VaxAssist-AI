import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppShell from '../layouts/AppShell';

// Public Pages
import HomePage from '../pages/HomePage';
import FeaturesPage from '../pages/public/FeaturesPage';
import HowItWorksPage from '../pages/public/HowItWorksPage';
import FaqPage from '../pages/public/FaqPage';
import SystemTestPage from '../pages/SystemTestPage';
import NotFoundPage from '../pages/NotFoundPage';

// Legal & Informational Pages
import TermsPage from '../pages/public/TermsPage';
import PrivacyPage from '../pages/public/PrivacyPage';
import MedicalDisclaimerPage from '../pages/public/MedicalDisclaimerPage';
import AITransparencyPage from '../pages/public/AITransparencyPage';
import SecurityPage from '../pages/public/SecurityPage';
import CookiePolicyPage from '../pages/public/CookiePolicyPage';
import AccessibilityPage from '../pages/public/AccessibilityPage';
import ContactPage from '../pages/public/ContactPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Dashboard Pages
import PatientDashboard from '../pages/dashboards/PatientDashboard';
import HealthcareDashboard from '../pages/dashboards/HealthcareDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';

// Patient Module Pages
import {
  FamilyPage,
  FamilyMemberDetailPage,
  VaccinationsPage,
  SchedulePage,
  RemindersPage,
  AIAssistantPage,
  ReportsPage,
  ProfilePage,
  SettingsPage,
} from '../pages/patient/PatientPages';

// Healthcare Worker Module Pages
import {
  HealthcarePatientsPage,
  HealthcarePatientDetailPage,
  HealthcareVaccinationsPage,
  HealthcareSchedulesPage,
  HealthcareReportsPage,
  HealthcareNotificationsPage,
  HealthcareSettingsPage,
} from '../pages/healthcare/HealthcarePages';

// Admin Module Pages
import {
  AdminUsersPage,
  AdminHealthcareWorkersPage,
  AdminKnowledgeBasePage,
  AdminVaccinationConfigPage,
  AdminNotificationsPage,
  AdminAnalyticsPage,
  AdminReportsPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
} from '../pages/admin/AdminPages';

// Guards
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleRoute from '../components/auth/RoleRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. PUBLIC WEBSITE ROUTES */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/system-test" element={<SystemTestPage />} />

        {/* Legal & Informational Pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
        <Route path="/ai-transparency" element={<AITransparencyPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* 2. AUTHENTICATED APPLICATION SHELL ROUTES */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* PATIENT / FAMILY APPLICATION */}
        <Route
          path="/patient/dashboard"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </RoleRoute>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/family/dashboard" element={<Navigate to="/patient/dashboard" replace />} />
        
        <Route
          path="/family"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <FamilyPage />
            </RoleRoute>
          }
        />
        <Route
          path="/family/:id"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <FamilyMemberDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/vaccinations"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <VaccinationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <SchedulePage />
            </RoleRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <RemindersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <RoleRoute allowedRoles={['PATIENT', 'ADMIN', 'HEALTHCARE_WORKER']}>
              <AIAssistantPage />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={['PATIENT', 'ADMIN']}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <ProfilePage />
            </RoleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <SettingsPage />
            </RoleRoute>
          }
        />

        {/* HEALTHCARE WORKER APPLICATION */}
        <Route
          path="/healthcare/dashboard"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}>
              <HealthcareDashboard />
            </RoleRoute>
          }
        />
        <Route path="/healthcare" element={<Navigate to="/healthcare/dashboard" replace />} />
        <Route
          path="/healthcare/patients"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}>
              <HealthcarePatientsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/healthcare/patients/:id"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}>
              <HealthcarePatientDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/healthcare/vaccinations"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}>
              <HealthcareVaccinationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/healthcare/schedules"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}>
              <HealthcareSchedulesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/healthcare/reports"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}>
              <HealthcareReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/healthcare/notifications"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER']}>
              <HealthcareNotificationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/healthcare/settings"
          element={
            <RoleRoute allowedRoles={['HEALTHCARE_WORKER']}>
              <HealthcareSettingsPage />
            </RoleRoute>
          }
        />

        {/* ADMIN APPLICATION */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/healthcare-workers"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminHealthcareWorkersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/knowledge-base"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminKnowledgeBasePage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/vaccination-configuration"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminVaccinationConfigPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminNotificationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAnalyticsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAuditLogsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 CATCH-ALL (rendered within PublicLayout for consistency) */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
