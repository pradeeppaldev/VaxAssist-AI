import React from 'react';
import { 
  Users, 
  Stethoscope, 
  Database, 
  Sliders, 
  Bell, 
  FileBarChart2, 
  History, 
  Settings,
  Sparkles
} from 'lucide-react';
import ModulePlaceholderPage from '../common/ModulePlaceholderPage';

// Re-export dedicated implementations
export { AdminUsersPage } from './AdminUsersPage';
export { AdminHealthcareWorkersPage } from './AdminHealthcareWorkersPage';
export { AdminKnowledgeBasePage } from './AdminKnowledgeBasePage';
export { AdminAnalyticsPage } from './AdminAnalyticsPage';
export { AdminNotificationsPage } from './AdminNotificationsPage';
export { AdminAuditLogsPage } from './AdminAuditLogsPage';

// Backwards compatibility alias
export { AdminAnalyticsPage as AdminReportsPage } from './AdminAnalyticsPage';

export function AdminVaccinationConfigPage() {
  return (
    <ModulePlaceholderPage
      title="Vaccination Configuration & Rules"
      subtitle="Deterministic schedule definitions for Universal NIS, Endemic NIS (JE), and Private/IAP regimens."
      icon={Sliders}
      roleName="System Administrator"
      badgeText="Engine Configuration"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Vaccination Config" }
      ]}
    />
  );
}

export function AdminSettingsPage() {
  return (
    <ModulePlaceholderPage
      title="System Settings"
      subtitle="Global platform settings, API key integrations, database configurations, and maintenance modes."
      icon={Settings}
      roleName="System Administrator"
      badgeText="Admin Console"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Settings" }
      ]}
    />
  );
}
