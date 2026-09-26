import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, FileText, Mail } from 'lucide-react';

export default function TermsPage() {
  const tableOfContents = [
    { id: 'account-usage', title: '1. Basic Account Usage' },
    { id: 'user-responsibilities', title: '2. User Responsibilities' },
    { id: 'vaccination-records', title: '3. Vaccination Records' },
    { id: 'ai-features', title: '4. AI Assistance Features' },
    { id: 'reminders', title: '5. Reminders & Notifications' },
    { id: 'prohibited-use', title: '6. Prohibited Use' },
    { id: 'service-limitations', title: '7. Service Limitations' },
    { id: 'termination', title: '8. Account Termination' },
    { id: 'changes', title: '9. Changes to Terms' },
    { id: 'contact', title: '10. Contact Information' },
  ];

  return (
    <LegalPageLayout
      badge="Terms of Service"
      title="VaxAssist AI Terms of Service"
      subtitle="Please read these terms carefully before using the VaxAssist AI platform. They govern your access to family immunization tracking, reminders, and AI-assisted guidance."
      lastUpdated="September 2026"
      tableOfContents={tableOfContents}
    >
      {/* Overview Notice */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Key Summary:</strong> VaxAssist AI is an administrative and informational tool designed to help families organize immunization timelines. It does not provide medical diagnosis, treatment, or clinical prescriptions. Always verify health decisions with your licensed pediatrician or doctor.
        </span>
      </div>

      {/* 1. Basic Account Usage */}
      <section id="account-usage" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">1. Basic Account Usage</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              By creating an account on VaxAssist AI, you agree to provide accurate, current, and complete registration information for yourself and the family members you manage.
            </p>
            <p>
              Accounts are intended for individual households and designated caregivers. You are responsible for safeguarding your login credentials and restricting unauthorized access to your account devices.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. User Responsibilities */}
      <section id="user-responsibilities" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">2. User Responsibilities</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              As a user of VaxAssist AI, you agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Enter genuine dates of birth and vaccination dates to ensure accurate schedule calculations.</li>
              <li>Confirm all immunization dates and booster intervals with your clinic, pediatrician, or hospital before doses are administered.</li>
              <li>Promptly update your family profile if a dose is received or delayed.</li>
              <li>Never use the platform to impersonate another individual or misrepresent medical qualifications.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 3. Vaccination Records */}
      <section id="vaccination-records" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">3. Vaccination Records</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Records logged within VaxAssist AI are intended for personal family reference and convenient organizational tracking.
            </p>
            <p>
              Digital summaries, dose checklists, and exported cards provided by VaxAssist AI reflect user-submitted data. They do not constitute official statutory proof of immunization or government certifications unless verified and signed by an authorized healthcare provider.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. AI Features */}
      <section id="ai-features" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">4. AI Assistance Features</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI includes automated assistant features powered by retrieval over public national immunization schedules.
            </p>
            <p>
              AI responses are purely informational and educational. Language models can occasionally produce incomplete or inaccurate responses. Never disregard professional clinical advice or delay seeking medical care because of information provided by the AI Assistant.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 5. Reminders & Notifications */}
      <section id="reminders" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">5. Reminders &amp; Notifications</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI provides automated reminders via dashboard alerts, SMS, or email as a convenience.
            </p>
            <p>
              Delivery of notifications can be influenced by device settings, telecommunications providers, or network availability. You remain responsible for tracking your family’s immunization dates and should not rely exclusively on automated reminder delivery.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 6. Prohibited Use */}
      <section id="prohibited-use" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">6. Prohibited Use</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              You agree not to engage in any of the following activities on the platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Attempting to gain unauthorized access to other users' accounts or clinical records.</li>
              <li>Reverse engineering, scraping, or attempting to extract proprietary datasets.</li>
              <li>Introducing malicious code, viruses, or automated bot traffic.</li>
              <li>Using the platform for any fraudulent or unlawful medical purpose.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 7. Service Limitations */}
      <section id="service-limitations" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">7. Service Limitations</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI is provided on an "as is" and "as available" basis. While we strive for continuous availability and precision, we cannot guarantee uninterrupted access or zero errors during maintenance windows or infrastructure updates.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 8. Account Termination */}
      <section id="termination" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">8. Account Termination</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              You may close your account at any time through your Profile &amp; Settings page. Upon closure, access to your active dashboard will cease. We reserve the right to suspend or terminate accounts that breach these terms or engage in security tampering.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 9. Changes to Terms */}
      <section id="changes" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">9. Changes to Terms</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              We may revise these Terms of Service periodically to reflect platform updates, feature releases, or statutory guidelines. We will indicate the date of the latest update at the top of this document. Continued use of the platform after updates constitutes acceptance.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 10. Contact Information */}
      <section id="contact" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">10. Contact Information</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              If you have any questions regarding these Terms of Service, please reach out to our legal and support team:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center gap-2 text-xs">
                <Mail className="h-4 w-4 text-primary" />
                <span>
                  <strong>Legal:</strong>{' '}
                  <span className="text-foreground font-mono">legal@vaxassist.ai</span>{' '}
                  <span className="text-muted-foreground text-[10px]">(placeholder)</span>
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center gap-2 text-xs">
                <Mail className="h-4 w-4 text-primary" />
                <span>
                  <strong>Support:</strong>{' '}
                  <span className="text-foreground font-mono">support@vaxassist.ai</span>{' '}
                  <span className="text-muted-foreground text-[10px]">(placeholder)</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
