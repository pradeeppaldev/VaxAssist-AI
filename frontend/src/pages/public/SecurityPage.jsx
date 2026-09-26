import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Lock, Key, Users, EyeOff, Mail } from 'lucide-react';

export default function SecurityPage() {
  return (
    <LegalPageLayout
      badge="Security Architecture"
      title="Platform Security & Data Protection"
      subtitle="How VaxAssist AI safeguards family records, authentication, and clinical workflows across the application."
      lastUpdated="September 2026"
    >
      {/* Intro Overview */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Security Overview:</strong> We build security into every layer of VaxAssist AI — from isolated household tenancy and role-based permissions to encrypted transport and responsible vulnerability disclosure.
        </span>
      </div>

      {/* 1. Account Security */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <span>1. Account Security</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              User accounts are secured with modern cryptographic password hashing. Passwords are never stored in plain text and cannot be retrieved by support personnel.
            </p>
            <p>
              Users are encouraged to use unique, strong passwords. Active user sessions are guarded with cryptographically signed tokens that expire automatically upon logout or inactivity.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. Authentication & Authorization */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <span>2. Authentication &amp; API Authorization</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              All application endpoints require explicit token-based authentication. Client requests pass through verification middlewares before any database read or write operation is permitted. Unauthenticated requests are rejected immediately.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 3. Role-Based Access Control (RBAC) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span>3. Role-Based Access Control (RBAC)</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI enforces strict role separation across three distinct platform environments:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="text-xs font-bold text-foreground font-sora">Patient / Family</span>
                <p className="text-[11px] text-muted-foreground">Access restricted exclusively to the user's registered household and family profiles.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="text-xs font-bold text-foreground font-sora">Healthcare Worker</span>
                <p className="text-[11px] text-muted-foreground">Clinical interface accessible only after credential submission and explicit household linkage.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="text-xs font-bold text-foreground font-sora">System Admin</span>
                <p className="text-[11px] text-muted-foreground">Governance and knowledge-base curation; cannot view private individual medical conversations.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Secure Data Handling & Encryption */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-primary" />
          <span>4. Secure Data Handling &amp; Encryption</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              All traffic between your browser or mobile client and our servers is encrypted in transit using industry-standard TLS (Transport Layer Security) over HTTPS.
            </p>
            <p>
              Data stores are isolated logically to prevent data bleeding between distinct families, ensuring your health records remain strictly segregated.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 5. Reporting Security Issues */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <span>5. Vulnerability Disclosure &amp; Security Contact</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              We take security reports seriously. If you identify a potential security vulnerability or misconfiguration in VaxAssist AI, please report it to our engineering team:
            </p>
            <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center gap-2 text-xs">
              <Mail className="h-4 w-4 text-primary" />
              <span>
                <strong>Security Team:</strong>{' '}
                <span className="text-foreground font-mono">security@vaxassist.ai</span>{' '}
                <span className="text-muted-foreground text-[10px]">(placeholder)</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Please include reproduction steps and avoid accessing or modifying data belonging to other accounts while investigating.
            </p>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
