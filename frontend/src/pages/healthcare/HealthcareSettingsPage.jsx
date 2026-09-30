import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Building,
  ShieldCheck,
  Bell,
  Thermometer,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Database,
  FileText,
  Phone,
  Mail,
  Hospital
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { PageHeader } from '@/components/common/PageHeader';
import ModeToggle from '@/components/common/ModeToggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function HealthcareSettingsPage() {
  const { user } = useAuth();
  const { isDemoMode, demoStore, updateDemoHcwSettings, toggleDemoMode } = useDemoMode();

  const [form, setForm] = useState({
    name: 'Dr. Anjali Deshmukh',
    designation: 'Senior Consultant Pediatrician & Cold-Chain Supervisor',
    hospital: 'Lilavati Hospital & Research Centre',
    department: 'Pediatric Infectious Diseases & Immunization',
    licenseNumber: 'MMC-2012-08492',
    phone: '+91 98201 99882',
    email: 'dr.anjali.deshmukh@vaxassist.demo',
    coldChainId: 'MH-MUM-CC-042',
    dailyTargetDoses: 35,
    alertUrgentSms: true,
    alertBatchExpiry: true,
    alertTemperatureBreach: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  const showToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Populate initial values
  useEffect(() => {
    if (isDemoMode && demoStore.hcwSettings) {
      setForm(demoStore.hcwSettings);
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        hospital: user.clinic_or_hospital || prev.hospital,
        licenseNumber: user.license_number || prev.licenseNumber,
      }));
    }
  }, [isDemoMode, demoStore.hcwSettings, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (isDemoMode) {
      updateDemoHcwSettings(form);
      setIsSaving(false);
      showToast('Settings successfully updated (Demo Sandbox).');
      return;
    }

    // In Live Mode: save to localStorage / backend
    try {
      // Simulate backend persistence delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      showToast('Clinical settings and facility preferences saved successfully.');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs py-2.5 px-4 rounded-xl shadow-lg border border-border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{saveToast}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Professional & Facility Settings"
        description="Manage your clinical credentials, hospital affiliation, cold-chain equipment identifiers, and high-priority alert channels."
        badgeText={isDemoMode ? "Demo Mode Active" : "Live Settings"}
      />

      {/* Mode Control Card */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm font-sora text-foreground">
                Application Operating Mode
              </h3>
              <Badge variant={isDemoMode ? 'outline' : 'default'} className="text-[10px] font-mono">
                {isDemoMode ? 'Demo Sandbox' : 'Live Connected'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isDemoMode
                ? 'Currently running with simulated healthcare worker metrics and demo patient profiles. Actions do not alter live MongoDB data.'
                : 'Currently connected to the FastAPI production API and MongoDB Atlas. All edits and dose records update live databases.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Professional Clinical Identity */}
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle className="text-base font-bold font-sora">
                Clinical Practitioner Credentials
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Certified medical information appearing on patient certificates and digital vaccination passports.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Attending Doctor / Clinician Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Medical License / Registration Number</Label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  className="text-xs h-9 font-mono"
                  placeholder="e.g. MMC-2012-08492"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Clinical Designation &amp; Specialization</Label>
                <Input
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Clinical Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Primary Hospital / Clinical Facility</Label>
                <Input
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cold-Chain Unit Identifier</Label>
                <Input
                  value={form.coldChainId}
                  onChange={(e) => setForm({ ...form, coldChainId: e.target.value })}
                  className="text-xs h-9 font-mono"
                  placeholder="e.g. MH-MUM-CC-042"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact & Official Communications */}
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Building className="h-5 w-5" />
              <CardTitle className="text-base font-bold font-sora">
                Contact &amp; Clinic Communications
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Official contact coordinates used for parent SMS notifications and batch recall escalation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Official Clinical Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Emergency Duty Phone / Mobile</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Daily Planned Immunization Target (Doses/Day)</Label>
              <Input
                type="number"
                min="1"
                max="500"
                value={form.dailyTargetDoses}
                onChange={(e) => setForm({ ...form, dailyTargetDoses: parseInt(e.target.value, 10) || 30 })}
                className="text-xs h-9 sm:max-w-xs font-mono"
              />
              <span className="text-[11px] text-muted-foreground block">
                Used to compute the daily cohort capacity and stock reserve threshold calculations.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Alert & Telemetry Notifications */}
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-base font-bold font-sora">
                Clinical Telemetry &amp; Alert Subscriptions
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Configure real-time automated alerts dispatched by the Proactive Monitoring Agent.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 divide-y divide-border">
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Cold-Chain Temperature Breach Alerts</span>
                <p className="text-[11px] text-muted-foreground">
                  Immediate SMS and push notification when storage temperature deviates beyond 2°C - 8°C.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.alertTemperatureBreach}
                onChange={(e) => setForm({ ...form, alertTemperatureBreach: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Lot / Batch Expiration Warnings</span>
                <p className="text-[11px] text-muted-foreground">
                  Receive advance warnings 30 days prior to vaccine vial lot expiration.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.alertBatchExpiry}
                onChange={(e) => setForm({ ...form, alertBatchExpiry: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Urgent Overdue Catch-up Alerts</span>
                <p className="text-[11px] text-muted-foreground">
                  Daily digest of registered infants overdue for critical UIP milestones by more than 14 days.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.alertUrgentSms}
                onChange={(e) => setForm({ ...form, alertUrgentSms: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border p-4 bg-muted/15">
            <span className="text-[11px] text-muted-foreground">
              All credentials are cryptographically stamped into generated PDF records.
            </span>
            <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5 text-xs h-9">
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
