import React from 'react';
import { Stethoscope, Users, Syringe, CalendarDays, FileBarChart2, Bell, Settings } from 'lucide-react';
import ModulePlaceholderPage from '../common/ModulePlaceholderPage';

export { default as HealthcarePatientsPage } from './HealthcarePatientsPage';
export { default as HealthcarePatientDetailPage } from './HealthcarePatientDetailPage';

export { default as HealthcareVaccinationsPage } from './HealthcareVaccinationsPage';
export { default as HealthcareSchedulesPage } from './HealthcareSchedulesPage';
export { default as HealthcareReportsPage } from './HealthcareReportsPage';

export function HealthcareNotificationsPage() {
  return (
    <ModulePlaceholderPage
      title="Clinical Notifications & Alerts"
      subtitle="Upcoming clinic appointments, dose due reminders, and patient inquiries."
      icon={Bell}
      roleName="Healthcare Worker"
      badgeText="Clinical Workspace"
      breadcrumbs={[
        { label: "Dashboard", href: "/healthcare/dashboard" },
        { label: "Notifications" }
      ]}
    />
  );
}

export function HealthcareSettingsPage() {
  return (
    <ModulePlaceholderPage
      title="Professional Settings"
      subtitle="Clinic/hospital affiliation, professional medical license, and notification preferences."
      icon={Settings}
      roleName="Healthcare Worker"
      badgeText="Clinical Workspace"
      breadcrumbs={[
        { label: "Dashboard", href: "/healthcare/dashboard" },
        { label: "Settings" }
      ]}
    />
  );
}
