import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import ModulePlaceholderPage from '../common/ModulePlaceholderPage';

export { default as FamilyPage } from './FamilyPage';
export { default as FamilyMemberDetailPage } from './FamilyMemberDetailPage';

export { default as VaccinationsPage } from './VaccinationsPage';

export { default as SchedulePage } from './SchedulePage';
export { default as RemindersPage } from './RemindersPage';

export { default as AIAssistantPage } from './AIAssistantPage';

export { default as ReportsPage } from './ReportsPage';

export function ProfilePage() {
  return (
    <ModulePlaceholderPage
      title="User Profile"
      subtitle="Personal information, contact details, and household ownership settings."
      icon={Users}
      roleName="Patient / Family"
      badgeText="Account Management"
      breadcrumbs={[
        { label: "Dashboard", href: "/patient/dashboard" },
        { label: "Profile" }
      ]}
    />
  );
}

export function SettingsPage() {
  return (
    <ModulePlaceholderPage
      title="Account Settings"
      subtitle="Notification channels (email, SMS, WhatsApp), security, active sessions, and password management."
      icon={Users}
      roleName="Patient / Family"
      badgeText="Security & Preferences"
      breadcrumbs={[
        { label: "Dashboard", href: "/patient/dashboard" },
        { label: "Settings" }
      ]}
    />
  );
}
