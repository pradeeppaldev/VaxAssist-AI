import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Lock, Mail, Users, FileCheck } from 'lucide-react';

export default function PrivacyPage() {
  const tableOfContents = [
    { id: 'collection', title: '1. Information We Collect' },
    { id: 'usage', title: '2. How We Use Information' },
    { id: 'family-data', title: '3. Vaccination & Family Data' },
    { id: 'ai-processing', title: '4. AI & Retrieval Processing' },
    { id: 'sharing', title: '5. Data Sharing Boundaries' },
    { id: 'security', title: '6. Data Security Practices' },
    { id: 'retention', title: '7. Data Retention' },
    { id: 'rights', title: '8. User Privacy Rights' },
    { id: 'children', title: '9. Children & Minor Profiles' },
    { id: 'contact', title: '10. Privacy Contact' },
  ];

  return (
    <LegalPageLayout
      badge="Privacy & Confidentiality"
      title="VaxAssist AI Privacy Policy"
      subtitle="Your family's immunization records and health timelines are private. This policy outlines how VaxAssist AI collects, handles, and protects your information."
      lastUpdated="September 2026"
      tableOfContents={tableOfContents}
    >
      {/* Privacy Promise Banner */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Our Core Privacy Principle:</strong> We do not sell, rent, or trade your personal or family health data to third-party advertisers or data brokers. Data you enter is used exclusively to organize your vaccination schedules and deliver automated alerts.
        </span>
      </div>

      {/* 1. Information We Collect */}
      <section id="collection" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">1. Information We Collect</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>We collect only the information necessary to provide immunization tracking and reminders:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Account Credentials:</strong> Name, email address, phone number, and password hash.</li>
              <li><strong>Family Member Profiles:</strong> Names, relationships (e.g. child, parent), dates of birth, and biological sex for age-based schedule calculation.</li>
              <li><strong>Vaccination Records:</strong> Administered vaccines, dose numbers, dates, clinic locations, and batch/lot identifiers entered by you.</li>
              <li><strong>Inquiry History:</strong> Prompts submitted to the AI Assistant within your active session to generate relevant contextual answers.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 2. How We Use Information */}
      <section id="usage" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">2. How We Use Information</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>The information collected is used to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Calculate age-appropriate vaccination due dates against published national schedules.</li>
              <li>Deliver proactive reminder notifications before doses become overdue.</li>
              <li>Provide personalized context when you ask questions in the AI Assistant.</li>
              <li>Authenticate your login and protect against unauthorized account modifications.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 3. Vaccination & Family Data */}
      <section id="family-data" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">3. Vaccination &amp; Family Data</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Family member records are stored in an isolated household container. No family profile is public or discoverable on search engines. Only authenticated members of your household can view or modify records.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. AI & Retrieval Processing */}
      <section id="ai-processing" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">4. AI &amp; Retrieval Processing</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              When you submit a query to the VaxAssist AI Assistant, our retrieval engine references verified public immunization schedules (such as UIP guidelines) to formulate responses.
            </p>
            <p>
              Your queries and family health records are processed strictly to answer your active inquiry and are not shared with public artificial intelligence models for global training purposes.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 5. Data Sharing */}
      <section id="sharing" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">5. Data Sharing Boundaries</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI enforces strict data boundaries:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>No Third-Party Advertising:</strong> We do not share health data or contact lists with advertisers.</li>
              <li><strong>Healthcare Worker Verification:</strong> Clinical staff can only view a family's records if the household has explicitly shared access or linked their care.</li>
              <li><strong>Legal Compliance:</strong> We disclose account information only when required by law or a valid judicial order.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 6. Data Security Practices */}
      <section id="security" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">6. Data Security Practices</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              We implement industry-standard safeguards to secure your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Encrypted data transport using modern TLS/HTTPS protocols.</li>
              <li>Cryptographic password hashing to ensure raw passwords are never stored in plain text.</li>
              <li>Role-based access control preventing patients, healthcare workers, and admins from viewing unauthorized modules.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 7. Data Retention */}
      <section id="retention" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">7. Data Retention</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              We retain family records for as long as your account remains active. If you choose to delete your account, your profile data, family members, and vaccination logs are queued for permanent deletion from our production databases.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 8. User Privacy Rights */}
      <section id="rights" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">8. User Privacy Rights</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>You have full ownership of your data on VaxAssist AI:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Access &amp; Export:</strong> You can view and download your family's immunization summary cards anytime from the Reports section.</li>
              <li><strong>Correction:</strong> You can edit inaccurate birth dates, dose details, or contact numbers directly from your dashboard.</li>
              <li><strong>Deletion:</strong> You can request complete account removal through your settings.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 9. Children & Minor Profiles */}
      <section id="children" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">9. Children &amp; Minor Profiles</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI is designed for parents and legal guardians to manage their dependents' vaccination schedules. Minor children cannot register independent accounts; their profiles must be created and maintained by an adult account holder.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 10. Privacy Contact */}
      <section id="contact" className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground">10. Privacy Contact</h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              For privacy inquiries, data access requests, or questions regarding how your records are handled:
            </p>
            <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center gap-2 text-xs">
              <Mail className="h-4 w-4 text-primary" />
              <span>
                <strong>Privacy Officer:</strong>{' '}
                <span className="text-foreground font-mono">privacy@vaxassist.ai</span>{' '}
                <span className="text-muted-foreground text-[10px]">(placeholder)</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
