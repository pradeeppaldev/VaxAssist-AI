import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Bell, 
  Users, 
  Sun, 
  Moon, 
  Laptop, 
  Globe, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Edit3, 
  Key, 
  LogOut, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Sliders, 
  ShieldCheck, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  SunMedium,
  Palette
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  INITIAL_USER_PROFILE,
  INITIAL_SECURITY_SETTINGS,
  INITIAL_NOTIFICATION_PREFERENCES,
  INITIAL_FAMILY_PREFERENCES,
  INITIAL_REGIONAL_PREFERENCES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_DATE_FORMATS,
} from '@/data/mockSettingsData';
import { INITIAL_FAMILY_MEMBERS } from '@/data/mockFamilyData';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile Information', icon: User, desc: 'Personal credentials and emergency contacts' },
  { id: 'security', label: 'Security & Sessions', icon: Lock, desc: 'Password, two-factor auth, and active devices' },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell, desc: 'Reminder channels and automated alerts' },
  { id: 'family', label: 'Family Defaults', icon: Users, desc: 'Default members, schedules, and clinical sharing' },
  { id: 'appearance', label: 'Appearance & Theme', icon: Palette, desc: 'Light, dark, and system display modes' },
  { id: 'regional', label: 'Language & Regional', icon: Globe, desc: 'Preferred language, date format, and timezone' },
  { id: 'account', label: 'Account Management', icon: ShieldAlert, desc: 'Session logout, deactivation, and data deletion' },
];

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Read tab from query string or default to 'profile'
  const queryTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return SETTINGS_TABS.some((tab) => tab.id === t) ? t : 'profile';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState(queryTab);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'saving' | 'error'

  // Settings Local States
  const [profile, setProfile] = useState(INITIAL_USER_PROFILE);
  const [security, setSecurity] = useState(INITIAL_SECURITY_SETTINGS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATION_PREFERENCES);
  const [familyPrefs, setFamilyPrefs] = useState(INITIAL_FAMILY_PREFERENCES);
  const [regional, setRegional] = useState(INITIAL_REGIONAL_PREFERENCES);

  // Edit Profile Dialog state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  // Change Password Dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

  // Danger Zone Dialog states
  const [confirmSignoutOthersOpen, setConfirmSignoutOthersOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  // Synchronize tab if query param changes
  useEffect(() => {
    setActiveTab(queryTab);
  }, [queryTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/settings?tab=${tabId}`, { replace: true });
  };

  // Profile Save
  const handleSaveProfileModal = (e) => {
    e.preventDefault();
    setProfile({ ...editForm });
    setEditProfileOpen(false);
    setToastNotice('Profile information updated successfully.');
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    const p = passwordForm.newPass;
    if (!p) return { score: 0, text: 'None', color: 'bg-muted' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { score: 25, text: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, text: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, text: 'Good', color: 'bg-sky-500' };
    return { score: 100, text: 'Strong', color: 'bg-emerald-500' };
  }, [passwordForm.newPass]);

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      alert('New passwords do not match.');
      return;
    }
    setSecurity((prev) => ({
      ...prev,
      passwordLastChanged: 'Just now',
      securityEvents: [
        {
          id: `sec-${Date.now()}`,
          event: 'Password changed successfully',
          timestamp: 'Just now',
          location: 'Bengaluru, India',
          status: 'success',
        },
        ...prev.securityEvents,
      ],
    }));
    setChangePasswordOpen(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setToastNotice('Your account password has been updated.');
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleSignoutOtherSessions = () => {
    setSecurity((prev) => ({
      ...prev,
      activeSessions: prev.activeSessions.filter((s) => s.isCurrent),
    }));
    setConfirmSignoutOthersOpen(false);
    setToastNotice('Successfully signed out of all other active devices.');
    setTimeout(() => setToastNotice(null), 4000);
  };

  // General Settings Save
  const handleSaveAllSettings = () => {
    setViewState('saving');
    setTimeout(() => {
      setViewState('normal');
      setHasUnsavedChanges(false);
      setToastNotice('All account preferences and notification settings have been saved.');
      setTimeout(() => setToastNotice(null), 4000);
    }, 700);
  };

  const handleCancelChanges = () => {
    setNotifications(INITIAL_NOTIFICATION_PREFERENCES);
    setFamilyPrefs(INITIAL_FAMILY_PREFERENCES);
    setRegional(INITIAL_REGIONAL_PREFERENCES);
    setHasUnsavedChanges(false);
    setToastNotice('Settings restored to previous baseline.');
    setTimeout(() => setToastNotice(null), 3000);
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Account Settings & Preferences" 
          subtitle="Manage personal profile, notification delivery channels, security credentials, and family preferences."
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Loading account credentials, active sessions, and preferences..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Account Settings & Preferences" 
          subtitle="Manage personal profile, notification delivery channels, security credentials, and family preferences."
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Failed to Load Settings" 
          message="Could not retrieve your stored preferences from the identity management service."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Page Header */}
      <PageHeader
        title="Account Settings & Preferences"
        subtitle="Manage your personal profile, notification delivery channels, security credentials, and family immunization defaults."
        breadcrumbs={[
          { label: 'Dashboard', href: '/patient/dashboard' },
          { label: 'Settings' },
        ]}
        badge={
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-mono text-xs">
            {profile.roleLabel}
          </Badge>
        }
      />

      {/* State Preview Toolbar */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Toast Alert Feedback */}
      {toastNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{toastNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToastNotice(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Unsaved Changes Floating Bar */}
      {hasUnsavedChanges && (
        <div className="sticky top-20 z-30 p-3 sm:p-4 rounded-xl bg-card border-2 border-primary/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="font-semibold">You have unsaved changes in your preferences.</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelChanges}
              className="flex-1 sm:flex-initial text-xs h-8"
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAllSettings}
              disabled={viewState === 'saving'}
              className="flex-1 sm:flex-initial text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {viewState === 'saving' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 2. Main Settings Layout: Sidebar Tabs on Desktop + Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar (Desktop/Tablet) */}
        <div className="md:col-span-1 lg:col-span-4 space-y-2">
          {/* User Compact Card */}
          <Card className="border border-border p-4 bg-card/60 mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {profile.avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <h4 className="font-bold text-sm text-foreground truncate">{profile.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                <div className="pt-0.5 flex items-center gap-1.5">
                  <StatusBadge status={profile.account_status} size="sm" />
                </div>
              </div>
            </div>
          </Card>

          {/* Settings Sub-Nav Items */}
          <div className="rounded-xl border border-border bg-card p-1.5 space-y-1 shadow-2xs">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDanger = tab.id === 'account';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                    isActive
                      ? isDanger
                        ? 'bg-destructive/10 text-destructive font-bold border-l-3 border-l-destructive shadow-2xs'
                        : 'bg-primary/10 text-primary font-bold border-l-3 border-l-primary shadow-2xs'
                      : isDanger
                      ? 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? (isDanger ? 'text-destructive' : 'text-primary') : 'text-muted-foreground'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 lg:col-span-8 space-y-6">
          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <Card className="border border-border shadow-xs animate-fadeIn">
              <CardHeader className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    Personal Profile & Household Details
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Your verified identity, residential address, and emergency contact.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditForm({ ...profile });
                    setEditProfileOpen(true);
                  }}
                  className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 self-start sm:self-auto"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Button>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Avatar & Summary Banner */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="h-16 w-16 border-2 border-border shadow-xs">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {profile.avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">{profile.name}</h3>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono">
                          Verified Head of Household
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{profile.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 text-xs space-y-1">
                    <div className="text-muted-foreground font-mono">Role: <strong className="text-foreground">{profile.roleLabel}</strong></div>
                    <div className="text-muted-foreground font-mono">Member Since: <strong className="text-foreground">{profile.registeredDate}</strong></div>
                  </div>
                </div>

                {/* Identity & Demographics Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Demographic Credentials
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground font-mono">Date of Birth</span>
                      <div className="font-semibold text-foreground font-mono">{profile.dob}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground font-mono">Gender</span>
                      <div className="font-semibold text-foreground">{profile.gender}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground font-mono">Blood Group</span>
                      <div className="font-semibold text-primary font-mono">{profile.bloodGroup}</div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Residential Address
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-card text-xs flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{profile.address}</p>
                      <p className="text-muted-foreground">{profile.city}, {profile.state} — {profile.pincode}, {profile.country}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Designated Emergency Contact
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{profile.emergencyContact.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">Relationship: {profile.emergencyContact.relationship}</p>
                    </div>
                    <div className="font-mono text-primary font-medium">
                      {profile.emergencyContact.phone}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Security & Sessions */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Password & Two Factor */}
              <Card className="border border-border shadow-xs">
                <CardHeader className="p-5 border-b border-border/60">
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    Authentication & Credentials
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Manage your account password, multi-factor verification, and login security.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Change Password row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        <span>Account Password</span>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Last modified: {security.passwordLastChanged}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangePasswordOpen(true)}
                      className="text-xs gap-1.5 self-start sm:self-auto"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Change Password</span>
                    </Button>
                  </div>

                  {/* 2FA Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground">Two-Factor Authentication (2FA)</h4>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Verified method: {security.twoFactorMethod}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToastNotice('Two-Factor settings are managed via primary phone verification.')}
                      className="text-xs text-primary"
                    >
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card className="border border-border shadow-xs">
                <CardHeader className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Active Device Sessions
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Devices currently authorized to access your family immunization record.
                    </CardDescription>
                  </div>
                  {security.activeSessions.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmSignoutOthersOpen(true)}
                      className="text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out Other Sessions</span>
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="p-5 space-y-3">
                  {security.activeSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        sess.isCurrent ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary text-foreground">
                          {sess.deviceType === 'desktop' ? (
                            <Monitor className="h-4 w-4" />
                          ) : sess.deviceType === 'mobile' ? (
                            <Smartphone className="h-4 w-4" />
                          ) : (
                            <Tablet className="h-4 w-4" />
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{sess.device}</span>
                            {sess.isCurrent && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] py-0 px-1.5">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {sess.ip} &bull; {sess.location}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">{sess.lastActive}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Security Activity */}
              <Card className="border border-border shadow-xs">
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
                  <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                    Recent Security Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-2 text-xs">
                  {security.securityEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-medium text-foreground">{evt.event}</span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">{evt.timestamp} &bull; {evt.location}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Notification Preferences */}
          {activeTab === 'notifications' && (
            <Card className="border border-border shadow-xs animate-fadeIn">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Automated Immunization Reminders & Channels
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Customize how and when you receive schedule notices, overdue alerts, and clinic updates.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-6">
                {/* Section: Delivery Channels */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                      Active Communication Channels
                    </span>
                    <Badge variant="outline" className="text-[10.5px] font-mono">
                      Multi-Channel Dispatch
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>WhatsApp Direct</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Official verified template alerts</p>
                      </div>
                      <Switch
                        checked={notifications.channels.whatsapp}
                        onCheckedChange={(checked) => {
                          setNotifications({
                            ...notifications,
                            channels: { ...notifications.channels, whatsapp: checked },
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    {/* SMS */}
                    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          <span>Priority SMS</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Carrier SMS to registered mobile</p>
                      </div>
                      <Switch
                        checked={notifications.channels.sms}
                        onCheckedChange={(checked) => {
                          setNotifications({
                            ...notifications,
                            channels: { ...notifications.channels, sms: checked },
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span>Email Digest & Passes</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Certificates and monthly summaries</p>
                      </div>
                      <Switch
                        checked={notifications.channels.email}
                        onCheckedChange={(checked) => {
                          setNotifications({
                            ...notifications,
                            channels: { ...notifications.channels, email: checked },
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    {/* In-App */}
                    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-500" />
                          <span>In-App Banner Notifications</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Header bell alerts & popovers</p>
                      </div>
                      <Switch
                        checked={notifications.channels.inApp}
                        onCheckedChange={(checked) => {
                          setNotifications({
                            ...notifications,
                            channels: { ...notifications.channels, inApp: checked },
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section: Notification Event Types */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Alert Event Triggers
                  </span>

                  <div className="space-y-2">
                    {[
                      {
                        key: 'vaccineReminders',
                        label: 'Primary Vaccination Due Dates',
                        desc: 'Alerts on the scheduled date for all mandatory UIP and IAP vaccines.',
                      },
                      {
                        key: 'upcomingDoses',
                        label: 'Upcoming Advance Notices',
                        desc: 'Early reminders 7 days and 48 hours prior to an upcoming immunization milestone.',
                      },
                      {
                        key: 'overdueAlerts',
                        label: 'Overdue Dose Escalation Alerts',
                        desc: 'Urgent warnings when an immunization window has lapsed without recorded administration.',
                      },
                      {
                        key: 'scheduleChanges',
                        label: 'Clinical Guideline & Schedule Updates',
                        desc: 'Notices when national UIP or ACVIP protocols adjust antigen timing or recommendations.',
                      },
                      {
                        key: 'familyMemberUpdates',
                        label: 'Doctor Dose Confirmation Notices',
                        desc: 'Instant notifications when a pediatrician logs and signs a dose for your child.',
                      },
                      {
                        key: 'aiRecommendations',
                        label: 'AI Catch-Up & Seasonal Recommendations',
                        desc: 'Proactive suggestions for delayed catch-up regimens, JE endemic alerts, and annual flu shots.',
                      },
                      {
                        key: 'systemAnnouncements',
                        label: 'System Maintenance Announcements',
                        desc: 'Notices regarding platform upgrades, cloud backups, and scheduled maintenance windows.',
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h5 className="font-semibold text-xs text-foreground">{item.label}</h5>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifications.events[item.key]}
                          onCheckedChange={(checked) => {
                            setNotifications({
                              ...notifications,
                              events: { ...notifications.events, [item.key]: checked },
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Family Defaults */}
          {activeTab === 'family' && (
            <Card className="border border-border shadow-xs animate-fadeIn">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Family Care Defaults & Record Sharing
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Configure default member views, reminder timing, and doctor access permissions.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Default Child / Member */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Family Member on Dashboard</Label>
                  <Select
                    value={familyPrefs.defaultMemberId}
                    onValueChange={(val) => {
                      setFamilyPrefs({ ...familyPrefs, defaultMemberId: val });
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {INITIAL_FAMILY_MEMBERS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.relationship}, {m.age})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    This profile opens automatically when you navigate to your Dashboard or Vaccination Schedule.
                  </p>
                </div>

                {/* Reminder Advance Notice */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Advance Notice for Upcoming Reminders</Label>
                  <Select
                    value={familyPrefs.reminderTiming}
                    onValueChange={(val) => {
                      setFamilyPrefs({ ...familyPrefs, reminderTiming: val });
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 Days in Advance (Recommended for Clinic Booking)</SelectItem>
                      <SelectItem value="3d">3 Days in Advance</SelectItem>
                      <SelectItem value="1d">24 Hours Prior</SelectItem>
                      <SelectItem value="day_of">On the Day of Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Communication Channel */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Primary Alert Channel</Label>
                  <Select
                    value={familyPrefs.preferredChannel}
                    onValueChange={(val) => {
                      setFamilyPrefs({ ...familyPrefs, preferredChannel: val });
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp Direct (Instant Verified Delivery)</SelectItem>
                      <SelectItem value="sms">Priority Carrier SMS</SelectItem>
                      <SelectItem value="email">Official Email Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Data Sharing & CoWIN Sync Toggles */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Clinical Linkage & Privacy Controls
                  </span>

                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-xs text-foreground">
                        Authorize Registered Pediatricians to View Family Timeline
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        Enables verified doctors at Apollo, Fortis, and partner clinics to look up past immunization records.
                      </p>
                    </div>
                    <Switch
                      checked={familyPrefs.shareWithClinicians}
                      onCheckedChange={(checked) => {
                        setFamilyPrefs({ ...familyPrefs, shareWithClinicians: checked });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-xs text-foreground">
                        Automatic National Registry Synchronization (CoWIN / UIP)
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        Securely cross-checks administered doses against National Health Authority digital registries.
                      </p>
                    </div>
                    <Switch
                      checked={familyPrefs.autoSyncCoWIN}
                      onCheckedChange={(checked) => {
                        setFamilyPrefs({ ...familyPrefs, autoSyncCoWIN: checked });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: Appearance & Theme */}
          {activeTab === 'appearance' && (
            <Card className="border border-border shadow-xs animate-fadeIn">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Interface Appearance & Theme
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Select your preferred color scheme. Changes apply instantly across the entire application.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light Theme */}
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-3 ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border hover:border-muted-foreground/40 bg-card'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 w-9 h-9 flex items-center justify-center">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">Light Mode</span>
                        {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Clean light background with optimal contrast</p>
                    </div>
                  </div>

                  {/* Dark Theme */}
                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-3 ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border hover:border-muted-foreground/40 bg-card'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 w-9 h-9 flex items-center justify-center">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">Dark Mode</span>
                        {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Reduced glare for clinical or low-light usage</p>
                    </div>
                  </div>

                  {/* System Theme */}
                  <div
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-3 ${
                      theme === 'system'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border hover:border-muted-foreground/40 bg-card'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-secondary text-foreground w-9 h-9 flex items-center justify-center">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">System Default</span>
                        {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Automatically mirrors your OS preference</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Current Active Palette: <strong className="text-foreground capitalize">{theme} theme</strong> with Space Grotesk base typography.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: Language & Regional */}
          {activeTab === 'regional' && (
            <Card className="border border-border shadow-xs animate-fadeIn">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Language & Localization Preferences
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Choose your preferred regional dialect, calendar conventions, and timezone.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Language */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Interface Language</Label>
                  <Select
                    value={regional.language}
                    onValueChange={(val) => {
                      setRegional({ ...regional, language: val });
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Format */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Calendar Date Presentation</Label>
                  <Select
                    value={regional.dateFormat}
                    onValueChange={(val) => {
                      setRegional({ ...regional, dateFormat: val });
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_DATE_FORMATS.map((fmt) => (
                        <SelectItem key={fmt.code} value={fmt.code}>
                          {fmt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Standard Timezone</Label>
                  <Input
                    readOnly
                    value={regional.timeZone}
                    className="h-10 text-xs font-mono bg-muted/30"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Vaccination reminders and appointment clocks are calculated against Indian Standard Time (IST).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 7: Account Management & Danger Zone */}
          {activeTab === 'account' && (
            <Card className="border border-destructive/30 shadow-xs animate-fadeIn bg-card">
              <CardHeader className="p-5 border-b border-destructive/20 bg-destructive/5">
                <CardTitle className="text-base sm:text-lg font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Account Management & Danger Zone</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  High-impact actions relating to your credentials, session termination, and data retention.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Sign Out Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-sm text-foreground">Sign Out of Current Session</h5>
                    <p className="text-xs text-muted-foreground">Terminate session credentials on this browser immediately.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="text-xs gap-1.5 self-start sm:self-auto"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>

                {/* Deactivate Account */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-sm text-foreground">Temporarily Deactivate Account</h5>
                    <p className="text-xs text-muted-foreground">Pause automated reminders and hide family timeline until you log back in.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDeactivateOpen(true)}
                    className="text-xs gap-1.5 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 self-start sm:self-auto"
                  >
                    <span>Deactivate Account</span>
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-destructive/40 bg-destructive/5">
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-sm text-destructive font-bold">Permanently Delete Account & Records</h5>
                    <p className="text-xs text-muted-foreground">
                      Irreversibly remove all family member immunization profiles, medical logs, and certificates from the platform.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="text-xs gap-1.5 self-start sm:self-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Account</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveProfileModal} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Edit Profile Information</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update your verified contact and demographic credentials.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Legal Name *</Label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mobile Phone (with country code) *</Label>
                <Input
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Date of Birth</Label>
                  <Input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Blood Group</Label>
                  <Input
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Residential Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProfileOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>Change Account Password</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter your existing password and configure a strong replacement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Current Password *</Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">New Password *</Label>
                <Input
                  type="password"
                  required
                  placeholder="At least 8 characters with numbers & symbols"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  className="h-9 text-xs"
                />
                {passwordForm.newPass && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span>Password Strength:</span>
                      <span className="font-bold">{passwordStrength.text}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${passwordStrength.score}%` }}
                        className={`h-full ${passwordStrength.color} transition-all`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Confirm New Password *</Label>
                <Input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePasswordOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation: Sign Out Other Sessions */}
      <AlertDialog open={confirmSignoutOthersOpen} onOpenChange={setConfirmSignoutOthersOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out Other Active Sessions?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will revoke authentication tokens on your iPhone 15 and iPad Air. Only your current browser session will remain logged in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignoutOtherSessions}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out Other Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation: Deactivate Account */}
      <AlertDialog open={confirmDeactivateOpen} onOpenChange={setConfirmDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600">Deactivate Family Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Your automated vaccination reminders will be temporarily paused. You can reactivate your account at any time by simply logging back in with your email and password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDeactivateOpen(false);
                logout();
              }}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Deactivation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation: Delete Account */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Permanently Delete Account?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-destructive font-medium">
              WARNING: This action is irreversible. All vaccination records for Aarav, Ananya, and your family members will be permanently erased from VaxAssist AI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDeleteOpen(false);
                logout();
              }}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Inspection State Preview Toolbar
 */
function StatePreviewToolbar({ viewState, setViewState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>UI State Inspector:</span>
      </div>
      <div className="flex items-center gap-1">
        {['normal', 'loading', 'error'].map((st) => (
          <button
            key={st}
            onClick={() => setViewState(st)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium text-xs transition-colors ${
              viewState === st 
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SettingsPage;
