import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Stethoscope, PhoneCall, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function MedicalDisclaimerPage() {
  return (
    <LegalPageLayout
      badge="Medical & Clinical Disclaimer"
      title="Medical Disclaimer"
      subtitle="Important clinical notice regarding the nature, scope, and limitations of information provided by VaxAssist AI."
      lastUpdated="September 2026"
    >
      {/* Critical Emergency Banner */}
      <div className="p-5 rounded-2xl border-2 border-red-500/30 bg-red-500/10 dark:bg-red-500/15 space-y-2 text-foreground">
        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-bold text-base font-sora">
          <PhoneCall className="h-5 w-5 shrink-0" />
          <span>Not for Medical Emergencies</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
          If you, your child, or a family member are experiencing a medical emergency, acute illness, or severe adverse reaction following vaccination (such as anaphylaxis, breathing difficulty, or unmanageable fever), <strong>immediately call emergency services or proceed to the nearest emergency room or hospital</strong>. Do not use VaxAssist AI for emergency clinical guidance.
        </p>
      </div>

      {/* 1. Informational & Organizational Scope */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span>1. Informational &amp; Scheduling Purpose Only</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI is a digital scheduling, record-keeping, and educational assistant platform. It organizes vaccination timelines based on public immunization schedules (such as India's Universal Immunization Programme).
            </p>
            <p>
              The platform is <strong>not a medical doctor, pediatrician, clinic, or licensed healthcare provider</strong>. Content displayed on VaxAssist AI — including calculated timelines, vaccine descriptions, catch-up reminders, and AI Assistant responses — does not constitute medical advice, diagnosis, prescription, or clinical treatment.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. No Doctor-Patient Relationship */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <span>2. No Doctor-Patient Relationship</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Using VaxAssist AI, interacting with its assistant, or logging immunization records does not create a doctor-patient, confidential medical practitioner, or clinical fiduciary relationship.
            </p>
            <p>
              Communications through VaxAssist AI are automated administrative interactions. The platform cannot assess individual medical history, underlying allergies, genetic factors, immunocompromised conditions, or immediate physical symptoms.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 3. AI Limitations & Error Potential */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>3. AI-Generated Output &amp; Potential for Inaccuracies</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              The VaxAssist AI Assistant uses generative artificial intelligence combined with knowledge retrieval. While engineered to reference verified immunization schedules, artificial intelligence can:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Misinterpret nuances in a user’s typed question.</li>
              <li>Conflate differences between distinct national, regional, or private schedule recommendations.</li>
              <li>Produce responses that are incomplete, outdated, or factually incorrect.</li>
            </ul>
            <p>
              You should treat all AI suggestions as general reference material rather than definitive clinical instructions.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. Mandatory Professional Consultation */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-status-completed" />
          <span>4. Mandatory Consultation with Healthcare Professionals</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Always consult your registered pediatrician, family physician, or local immunization clinic before:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Administering any vaccine or booster dose to your child or family member.</li>
              <li>Altering a recommended catch-up schedule following illness or missed doses.</li>
              <li>Combining multiple vaccines in a single clinic visit.</li>
              <li>Administering vaccines during pregnancy or pre-existing chronic conditions.</li>
            </ul>
            <p>
              Never ignore or delay professional medical advice based on anything read or generated on VaxAssist AI.
            </p>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
