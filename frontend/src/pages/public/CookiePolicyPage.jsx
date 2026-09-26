import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, Settings, CheckCircle2, Sliders } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      badge="Cookies & Local Storage"
      title="Cookie Policy"
      subtitle="Clear and simple explanations of the cookies and local browser storage used by VaxAssist AI."
      lastUpdated="September 2026"
    >
      {/* 1. What Are Cookies */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary" />
          <span>1. What Are Cookies &amp; Local Storage?</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Cookies and local browser storage are small text files or key-value entries stored in your web browser when you visit websites. They help the platform remember who you are, keep you securely logged in, and preserve your visual preferences.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. Essential & Session Storage */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-status-completed" />
          <span>2. Essential &amp; Session Cookies</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              These cookies and storage items are strictly necessary for the platform to function properly. Without them, core features like logging into your family dashboard cannot operate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="font-bold text-foreground font-mono">Authentication Token</span>
                <p className="text-muted-foreground">Maintains your authenticated session so you don't need to re-type credentials on every page change.</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="font-bold text-foreground font-mono">Theme Mode</span>
                <p className="text-muted-foreground">Stores your preferred appearance (light or dark mode) so it persists across visits.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Optional Analytics & Performance */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          <span>3. Performance &amp; Usage Analytics</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              We may utilize aggregated, anonymous telemetry to monitor page load times, detect UI errors, and identify navigation bottlenecks.
            </p>
            <p>
              We do <strong>not</strong> use third-party advertising cookies, behavioral marketing trackers, or cross-site tracking beacons. Your health records are never correlated with advertising identities.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. How to Manage Cookies */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span>4. Managing Your Cookie Settings</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              You can control or delete cookies directly through your browser settings. Most browsers allow you to block cookies or alert you when cookies are sent.
            </p>
            <p>
              Please note that blocking essential cookies will prevent you from signing in to your VaxAssist AI account and accessing your family immunization records.
            </p>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
