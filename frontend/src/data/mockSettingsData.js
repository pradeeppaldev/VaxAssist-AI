/**
 * VaxAssist AI - User Profile, Account & Settings Mock Data
 * Realistic synthetic profile, notification preferences, security sessions,
 * and localization settings for Patient & Family accounts.
 */

export const INITIAL_USER_PROFILE = {
  id: 'USR-1002',
  name: 'Rajesh Verma',
  email: 'rajesh.verma@gmail.com',
  phone: '+91 98112 45901',
  dob: '1988-06-24',
  gender: 'Male',
  bloodGroup: 'O+',
  role: 'PATIENT',
  roleLabel: 'Family Care Administrator',
  account_status: 'ACTIVE',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  avatarFallback: 'RV',
  address: 'B-402, Green Park Residency, 14th Main, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
  country: 'India',
  emergencyContact: {
    name: 'Sunita Verma',
    relationship: 'Spouse',
    phone: '+91 98112 45902',
  },
  registeredDate: '2026-01-10',
  familySize: 3,
  verifiedPhone: true,
  verifiedEmail: true,
};

export const INITIAL_SECURITY_SETTINGS = {
  twoFactorEnabled: true,
  twoFactorMethod: 'SMS (+91 98112 •••01)',
  passwordLastChanged: '3 months ago (June 15, 2026)',
  activeSessions: [
    {
      id: 'sess-1',
      device: 'Chrome 128 / Windows 11',
      deviceType: 'desktop',
      location: 'Bengaluru, Karnataka, India',
      ip: '49.36.12.82',
      lastActive: 'Active now (This Device)',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'VaxAssist Mobile App / iPhone 15',
      deviceType: 'mobile',
      location: 'Bengaluru, Karnataka, India',
      ip: '49.36.12.82',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      device: 'Safari / iPad Air',
      deviceType: 'tablet',
      location: 'Bengaluru, Karnataka, India',
      ip: '103.21.144.18',
      lastActive: '3 days ago',
      isCurrent: false,
    },
  ],
  securityEvents: [
    {
      id: 'sec-1',
      event: 'Password changed successfully',
      timestamp: '2026-06-15 14:20',
      location: 'Bengaluru, India',
      status: 'success',
    },
    {
      id: 'sec-2',
      event: 'New login from iPhone 15',
      timestamp: '2026-08-01 10:15',
      location: 'Bengaluru, India',
      status: 'success',
    },
    {
      id: 'sec-3',
      event: 'Emergency contact details updated',
      timestamp: '2026-09-12 18:30',
      location: 'Bengaluru, India',
      status: 'success',
    },
  ],
};

export const INITIAL_NOTIFICATION_PREFERENCES = {
  // Channels
  channels: {
    whatsapp: true,
    sms: true,
    email: true,
    inApp: true,
  },
  // Event Types
  events: {
    vaccineReminders: true,
    upcomingDoses: true,
    overdueAlerts: true,
    scheduleChanges: true,
    familyMemberUpdates: true,
    aiRecommendations: true,
    systemAnnouncements: false,
  },
};

export const INITIAL_FAMILY_PREFERENCES = {
  defaultMemberId: 'fam-1',
  reminderTiming: '3d', // '7d' | '3d' | '1d' | 'day_of'
  preferredChannel: 'whatsapp', // 'whatsapp' | 'sms' | 'email'
  shareWithClinicians: true,
  autoSyncCoWIN: true,
  showPastDosesInTimeline: true,
};

export const INITIAL_REGIONAL_PREFERENCES = {
  language: 'en-IN',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  timeZone: 'Asia/Kolkata (IST, UTC+05:30)',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
];

export const SUPPORTED_DATE_FORMATS = [
  { code: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 25/09/2026 - Standard India)' },
  { code: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-09-25 - ISO standard)' },
  { code: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 09/25/2026 - US format)' },
];
