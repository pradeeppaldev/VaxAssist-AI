import {
  LayoutDashboard,
  Users,
  Syringe,
  CalendarDays,
  Bell,
  Sparkles,
  FileBarChart2,
  Settings,
  UserCheck,
  Stethoscope,
  Database,
  Sliders,
  History,
  ShieldCheck,
  User
} from 'lucide-react';

export const ROLE_NAVIGATION = {
  PATIENT: {
    roleName: 'Family Care',
    badgeText: 'Patient / Family',
    badgeVariant: 'secondary',
    basePath: '/patient',
    items: [
      {
        title: 'Dashboard',
        href: '/patient/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Family',
        href: '/family',
        icon: Users,
      },
      {
        title: 'Vaccinations',
        href: '/vaccinations',
        icon: Syringe,
      },
      {
        title: 'Schedule',
        href: '/schedule',
        icon: CalendarDays,
      },
      {
        title: 'Reminders',
        href: '/reminders',
        icon: Bell,
      },
      {
        title: 'AI Assistant',
        href: '/ai-assistant',
        icon: Sparkles,
        isAI: true,
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: FileBarChart2,
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
    mobileItems: [
      { title: 'Home', href: '/patient/dashboard', icon: LayoutDashboard },
      { title: 'Family', href: '/family', icon: Users },
      { title: 'Vaccines', href: '/vaccinations', icon: Syringe },
      { title: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, isAI: true },
      { title: 'Schedule', href: '/schedule', icon: CalendarDays },
    ],
  },

  HEALTHCARE_WORKER: {
    roleName: 'Clinical Portal',
    badgeText: 'Healthcare Professional',
    badgeVariant: 'info',
    basePath: '/healthcare',
    items: [
      {
        title: 'Dashboard',
        href: '/healthcare/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Patients / Families',
        href: '/healthcare/patients',
        icon: Users,
      },
      {
        title: 'Vaccination Records',
        href: '/healthcare/vaccinations',
        icon: Syringe,
      },
      {
        title: 'Clinical Schedules',
        href: '/healthcare/schedules',
        icon: CalendarDays,
      },
      {
        title: 'Clinical Reports',
        href: '/healthcare/reports',
        icon: FileBarChart2,
      },
      {
        title: 'Notifications',
        href: '/healthcare/notifications',
        icon: Bell,
      },
      {
        title: 'Settings',
        href: '/healthcare/settings',
        icon: Settings,
      },
    ],
    mobileItems: [
      { title: 'Dashboard', href: '/healthcare/dashboard', icon: LayoutDashboard },
      { title: 'Patients', href: '/healthcare/patients', icon: Users },
      { title: 'Vaccines', href: '/healthcare/vaccinations', icon: Syringe },
      { title: 'Schedules', href: '/healthcare/schedules', icon: CalendarDays },
      { title: 'Reports', href: '/healthcare/reports', icon: FileBarChart2 },
    ],
  },

  ADMIN: {
    roleName: 'System Administration',
    badgeText: 'System Admin',
    badgeVariant: 'review',
    basePath: '/admin',
    items: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'User Management',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: 'Healthcare Workers',
        href: '/admin/healthcare-workers',
        icon: Stethoscope,
      },
      {
        title: 'Knowledge Base',
        href: '/admin/knowledge-base',
        icon: Database,
        isAI: true,
      },
      {
        title: 'Vaccination Config',
        href: '/admin/vaccination-configuration',
        icon: Sliders,
      },
      {
        title: 'Notifications Queue',
        href: '/admin/notifications',
        icon: Bell,
      },
      {
        title: 'System Analytics',
        href: '/admin/analytics',
        icon: FileBarChart2,
      },
      {
        title: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: History,
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
    mobileItems: [
      { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Workers', href: '/admin/healthcare-workers', icon: Stethoscope },
      { title: 'Knowledge', href: '/admin/knowledge-base', icon: Database },
      { title: 'Config', href: '/admin/vaccination-configuration', icon: Sliders },
    ],
  },
};
