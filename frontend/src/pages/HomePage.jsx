import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Users, 
  Bell, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Stethoscope, 
  BookOpen, 
  Lock, 
  Clock, 
  Check, 
  AlertTriangle, 
  HelpCircle,
  Syringe,
  FileCheck,
  Search,
  BadgeCheck,
  ChevronRight,
  Database,
  Eye,
  HeartHandshake,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { AICard, AIHeader, AISourceCitation } from '@/components/ai/AIComponents';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function HomePage() {
  return (
    <div className="space-y-20 sm:space-y-28 pb-16 pt-4 sm:pt-8 overflow-hidden">
      
      {/* ============================================================ */}
      {/* 6. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary select-none">
              <ShieldCheck className="h-4 w-4" />
              <span>National Immunization Schedule &bull; UIP Grounded</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-itim text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground leading-[1.15]">
                Vaccination care, organized for your{' '}
                <span className="text-primary underline decoration-primary/30 decoration-wavy decoration-2">
                  whole family.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-sans">
                Manage vaccination records, schedules, automated reminders, healthcare verification, and AI-powered guidance in one trusted, unified place.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Button asChild size="lg" variant="cyan" className="font-semibold text-base px-8 h-12 shadow-sm gap-2">
                <Link to="/register">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base h-12 font-medium px-6">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            {/* Micro-trust indicators */}
            <div className="pt-4 border-t border-border/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Deterministic Age Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Multi-Profile Household</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Official Guideline Grounding</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Quality Product UI Preview */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xl transition-all">
              
              {/* Mock Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <span className="text-xs font-mono text-muted-foreground ml-2">vaxassist.care/dashboard</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                  Family Active
                </Badge>
              </div>

              {/* Family Members Selector Preview */}
              <div className="pt-5 space-y-4">
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3.5 py-2 shrink-0 text-sm font-bold text-primary shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>Aarav (9 mo)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/60 border border-border px-3.5 py-2 shrink-0 text-sm text-muted-foreground">
                    <span>Diya (4 yr)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/60 border border-border px-3.5 py-2 shrink-0 text-sm text-muted-foreground">
                    <span>Self</span>
                  </div>
                </div>

                {/* Priority Vaccination Due Card */}
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-foreground font-sans">MR-1 (Measles &amp; Rubella)</span>
                        <span className="text-xs font-mono uppercase bg-primary/15 text-primary px-2 py-0.5 rounded font-bold">
                          Dose 1
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Due at completion of 9 months &bull; Left Upper Arm (Subcutaneous)
                      </p>
                    </div>
                    <StatusBadge status="DUE" />
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-primary/15 text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <Clock className="h-4 w-4" />
                      <span>Window: 9 to 12 months</span>
                    </span>
                    <span className="font-semibold text-foreground">Recommended Now</span>
                  </div>
                </div>

                {/* Progress Metric */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-muted-foreground">UIP Immunization Progress</span>
                    <span className="font-bold text-foreground font-mono">8 of 11 Completed (73%)</span>
                  </div>
                  <Progress value={73} className="h-2.5 bg-secondary" indicatorClassName="bg-primary" />
                </div>

                {/* Grounded Assistant Snippet */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground font-sora">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>AI Schedule Monitor</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">NIS Grounded</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    "JE-1 is also due if residing in an identified Japanese Encephalitis endemic district."
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. TRUST / VALUE STRIP                                       */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="rounded-2xl border border-border bg-muted/30 py-5 px-6 sm:px-8 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-border/60">
            <div className="flex items-center justify-center gap-2.5 pt-2 md:pt-0">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-foreground">Family Profiles</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2 md:pt-0">
              <Bell className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-foreground">Smart Reminders</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2 md:pt-0">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-foreground">UIP Guidelines</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2 md:pt-0">
              <Stethoscope className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-foreground">Clinical Verification</span>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-2.5 pt-2 md:pt-0">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-foreground font-sora">Grounded AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. PROBLEM SECTION                                           */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-border text-xs uppercase tracking-wider font-mono">
            The Healthcare Challenge
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
            Vaccination information shouldn't be scattered.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Traditional paper immunization cards and fragmented clinic records create confusion, missed milestone windows, and clinical blind spots.
          </p>
        </div>

        {/* Structured Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* The Traditional Problem */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="uppercase tracking-wider font-mono text-xs font-bold">The Scattered Reality</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground font-sans">
                Paper cards get lost, milestones get overlooked.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When health records are stored in paper booklets or across different clinics, families are left guessing which doses are pending and when boosters are required.
              </p>
            </div>

            <ul className="space-y-3.5 text-sm text-muted-foreground border-t border-destructive/15 pt-5">
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <span>Physical vaccination booklets are frequently lost, water-damaged, or unavailable during travel.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <span>Managing schedules for multiple children and elderly parents becomes overwhelmingly chaotic.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <span>Families miss crucial immunization windows due to lack of proactive reminders.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <span>Confusing internet advice causes hesitation over intervals and contraindications.</span>
              </li>
            </ul>
          </div>

          {/* The VaxAssist Approach */}
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="uppercase tracking-wider font-mono text-xs font-bold">The VaxAssist Standard</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground font-sans">
                Deterministic schedules, automated alerts, total clarity.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                VaxAssist calculates exact milestone dates directly from date of birth, tracks multiple family dependents, and pairs records with verified clinical guidance.
              </p>
            </div>

            <ul className="space-y-3.5 text-sm text-muted-foreground border-t border-primary/20 pt-5">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Permanent digital immunization ledger accessible from any device at any time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Unified household overview with dynamic age calculation for each dependent.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Automated milestone reminders prevent missed booster windows before they occur.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Answers grounded in authoritative national immunization manuals and WHO standards.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. CORE FEATURES SECTION                                     */}
      {/* ============================================================ */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl scroll-mt-24">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-primary/30 text-primary text-xs uppercase tracking-wider font-mono">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
            Complete Digital Immunization Suite
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Six cohesive pillars built to ensure seamless tracking, clinical precision, and proactive family health management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans">Family Vaccination Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
              Track vaccination histories for multiple children, spouses, self, and elderly dependents under one household hub. Dynamic age calculations adjust over time.
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <Calendar className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans">Smart Scheduling &amp; Reminders</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
              Calculates upcoming, due, and overdue vaccination windows deterministically. Automated reminder sequences notify families before milestone windows elapse.
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans font-sora">AI Vaccination Assistant</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
              Ask vaccination-related questions and receive personalized guidance grounded in your active family member's age and verified immunization manuals.
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans">Trusted Knowledge</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
              AI responses are grounded in verified guidelines from the Universal Immunization Programme (UIP) and WHO documentation, preventing misleading hallucinations.
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <Stethoscope className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans">Healthcare Worker Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
              Authorized clinical personnel can inspect patient profiles, record vaccine batch numbers, injection sites, and certify administered doses.
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans">Reports &amp; Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
              Generate standardized immunization summaries, travel vaccination records, and official certificates ready for school admissions or daycare enrollment.
            </CardContent>
          </Card>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. HOW IT WORKS                                             */}
      {/* ============================================================ */}
      <section id="how-it-works" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl scroll-mt-24">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="border-border text-xs uppercase tracking-wider font-mono">
              Simple 4-Step Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
              How VaxAssist AI Works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              From account setup to lifelong immunization tracking in four intuitive steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="relative flex flex-col p-6 rounded-xl bg-background border border-border/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold font-mono text-base">
                  01
                </span>
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">Setup</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-foreground font-sans">Create Your Profile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Register your account and create profiles for your family members, recording their date of birth and basic health vitals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col p-6 rounded-xl bg-background border border-border/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold font-mono text-base">
                  02
                </span>
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">Log</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-foreground font-sans">Add Vaccination Records</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Organize historical doses from physical cards or newborn birth records into your permanent digital ledger.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col p-6 rounded-xl bg-background border border-border/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold font-mono text-base">
                  03
                </span>
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">Track</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-foreground font-sans">Stay on Schedule</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive proactive reminder notifications and monitor upcoming or overdue doses through real-time status indicators.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col p-6 rounded-xl bg-background border border-border/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold font-mono text-base">
                  04
                </span>
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-sora font-semibold">Assist</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-foreground font-sans">Get Trusted Guidance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consult the VaxAssist AI assistant for contextual explanations, catch-up dose recommendations, and verified guidelines.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 11. FAMILY / PATIENT SECTION                                 */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Text & Key Value points */}
          <div className="lg:col-span-6 space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Family &amp; Patient Experience
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
              One place for your family's vaccination journey.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Designed specifically for parents and caregivers to maintain total visibility over immunization milestones without anxiety or guesswork.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-base text-foreground">Multi-Member Profiles</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Switch between children and adult dependents with a single click, viewing personalized timelines for each.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-base text-foreground">Clear Status Indicators</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every dose is categorized as Completed, Upcoming, Due Now, or Catch-Up Needed so you never miss an appointment.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-base text-foreground">Instant Verified Records</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Export printable vaccination cards and compliance reports formatted for school admission or travel.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild variant="cyan" size="lg" className="font-semibold px-6">
                <Link to="/register">Create Your Family Account</Link>
              </Button>
            </div>
          </div>

          {/* Right: Polished Family Interface Mockup */}
          <div className="lg:col-span-6">
            <Card className="border-border bg-card p-6 sm:p-7 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      AS
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Aarav Sharma</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">9 Months Old &bull; DOB: 14 Oct 2025</p>
                  </div>
                </div>
                <StatusBadge status="DUE" />
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground font-medium">Vaccination Progress</span>
                  <span className="font-bold text-foreground font-mono">73% (8/11 Doses)</span>
                </div>
                <Progress value={73} className="h-2.5" />
              </div>

              {/* Doses List Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-foreground">OPV &amp; Pentavalent-3</span>
                    <p className="text-xs text-muted-foreground">Administered at 14 Weeks &bull; Verified</p>
                  </div>
                  <StatusBadge status="COMPLETED" />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/25">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-foreground">MR-1 (Measles &amp; Rubella)</span>
                    <p className="text-xs text-muted-foreground">Recommended at 9 Months &bull; Subcutaneous</p>
                  </div>
                  <StatusBadge status="DUE" />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-foreground">DPT Booster-1</span>
                    <p className="text-xs text-muted-foreground">Scheduled at 16–24 Months</p>
                  </div>
                  <StatusBadge status="UPCOMING" />
                </div>
              </div>

              {/* Bottom Quick Action Note */}
              <div className="pt-3 flex items-center justify-between text-xs sm:text-sm text-muted-foreground border-t border-border">
                <span>Automated reminder scheduled for 28 Sep</span>
                <span className="font-semibold text-primary">View Full Schedule &rarr;</span>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 12. HEALTHCARE WORKER SECTION                                */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 lg:p-12 shadow-sm space-y-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-6 space-y-4">
              <Badge variant="outline" className="border-border text-xs uppercase tracking-wider font-mono">
                Healthcare Professional Portal
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
                Better vaccination records for healthcare teams.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                A dedicated clinical workspace designed for pediatricians, nurses, and community healthcare workers to verify, record, and monitor immunizations with clinical precision.
              </p>

              {/* Important Authorization Notice */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 sm:p-5 text-sm space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Authorized Patient Access Only</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  Healthcare professionals only access patient records when explicitly authorized by the family, ensuring strict compliance with patient confidentiality.
                </p>
              </div>

              <div className="pt-2">
                <Button asChild variant="outline" size="lg" className="font-semibold px-6">
                  <Link to="/login">Healthcare Worker Login</Link>
                </Button>
              </div>
            </div>

            {/* Right: Clinical Workflow Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-xl border border-border bg-background space-y-2.5 shadow-2xs">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base text-foreground font-sans">Dose Verification</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Record administered batch numbers, manufacturers, sites, and digitally sign verification entries.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-background space-y-2.5 shadow-2xs">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                  <Search className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base text-foreground font-sans">Patient Registry</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Quickly retrieve authorized family records to review baseline compliance during clinical sessions.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-background space-y-2.5 shadow-2xs">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                  <Clock className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base text-foreground font-sans">Catch-Up Schedules</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Evaluate minimum dose intervals and delayed administration rules for missed childhood vaccines.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-background space-y-2.5 shadow-2xs">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base text-foreground font-sans">Clinical Reports</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Export verified patient vaccination histories and coverage statistics for audits and continuity of care.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 13. AI + RAG SECTION                                         */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <AICard className="p-6 sm:p-10 lg:p-12">
          <div className="space-y-10">
            
            {/* AI Section Header using Sora */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Grounded Healthcare AI</span>
              </Badge>
              <h2 className="font-sora text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                AI assistance grounded in trusted vaccination knowledge.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                No generic web searches or medical guesses. VaxAssist AI combines active family context with verified immunization guidelines to deliver clear, source-backed answers.
              </p>
            </div>

            {/* 4-Step Grounded Architecture Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-1.5">
                <span className="text-xs font-mono font-bold text-primary uppercase">Step 01</span>
                <p className="font-bold text-sm text-foreground font-sora">User Question</p>
                <p className="text-xs text-muted-foreground leading-tight">Patient or clinic inquiry</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-1.5">
                <span className="text-xs font-mono font-bold text-primary uppercase">Step 02</span>
                <p className="font-bold text-sm text-foreground font-sora">Context Resolution</p>
                <p className="text-xs text-muted-foreground leading-tight">Active age &amp; history check</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-1.5">
                <span className="text-xs font-mono font-bold text-primary uppercase">Step 03</span>
                <p className="font-bold text-sm text-foreground font-sora">Knowledge Retrieval</p>
                <p className="text-xs text-muted-foreground leading-tight">Official NIS/WHO standard</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-1.5">
                <span className="text-xs font-mono font-bold text-primary uppercase">Step 04</span>
                <p className="font-bold text-sm text-foreground font-sora">Grounded Guidance</p>
                <p className="text-xs text-muted-foreground leading-tight">Source-cited response</p>
              </div>
            </div>

            {/* Interactive Query & Response Demonstration */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Question & Answer Box */}
              <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-4 shadow-sm">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold">
                    Family Query
                  </span>
                  <div className="rounded-xl bg-muted/60 p-4 text-sm text-foreground leading-relaxed">
                    "When is Aarav's next vaccination due, and can MR-1 be administered together with Vitamin A?"
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary font-sora">
                    <Sparkles className="h-4 w-4" />
                    <span>VaxAssist Assistant Response</span>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed space-y-2.5 bg-primary/5 p-4 sm:p-5 rounded-xl border border-primary/20">
                    <p>
                      Based on <strong>Aarav's age (9 months)</strong> and active schedule under the National Immunization Schedule:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                      <li>
                        <strong>MR-1 (Measles &amp; Rubella Dose 1)</strong> is currently due at completion of 9 months.
                      </li>
                      <li>
                        <strong>Vitamin A (1st dose, 100,000 IU)</strong> is co-administered with MR-1 as per standard UIP protocol.
                      </li>
                      <li>
                        If residing in an endemic district, <strong>JE-1</strong> is also co-administered at 9 months.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Grounded Source Citations */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">
                    Verified Citations
                  </span>
                  <Badge variant="outline" className="text-xs border-status-completed/30 text-status-completed font-mono">
                    Validated Sources
                  </Badge>
                </div>

                <AISourceCitation
                  title="National Immunization Schedule (NIS)"
                  source="Ministry of Health &amp; Family Welfare"
                  page="14"
                  confidence="98"
                />

                <AISourceCitation
                  title="Immunization in Practice Advisory"
                  source="World Health Organization Guidelines"
                  page="28"
                  confidence="94"
                />

                <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">Strict Grounding Rule:</strong> Responses cite official clinical documentation to provide dependable clarity rather than conversational guesswork.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </AICard>
      </section>

      {/* ============================================================ */}
      {/* 14. TRUSTED KNOWLEDGE SECTION                                */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-border text-xs uppercase tracking-wider font-mono">
            Medical Rigor
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
            Guidance backed by trusted health information.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Healthcare decisions require absolute reliability. VaxAssist adheres strictly to deterministic medical calculation and structured clinical knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground font-sans">Official Guidelines</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rules calibrated against the Universal Immunization Programme (UIP) and official pediatric schedules.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground font-sans">Structured Knowledge</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Indexed documentation organized by dose sequence, target disease, route, site, and contraindications.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground font-sans">Source-Aware Answers</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every AI response references the specific manual, chapter, or guideline chunk it retrieved.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground font-sans">Deterministic Calculation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Due dates and interval warnings are calculated via rigorous code algorithms, never estimated by LLMs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 15. SECURITY / PRIVACY SECTION                               */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-10 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary font-mono uppercase tracking-wider">
                <Lock className="h-3.5 w-3.5" />
                <span>Security &amp; Confidentiality</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                Designed with healthcare privacy at its core.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your family's immunization data is personal. VaxAssist is built with strict role separation, encrypted data transport, and explicit consent boundaries.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                <div className="font-bold text-sm sm:text-base text-foreground font-sans">Role Isolation</div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Strict boundaries ensure patients, clinical staff, and administrators only access permitted views.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                <div className="font-bold text-sm sm:text-base text-foreground font-sans">Explicit Authorization</div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Healthcare workers cannot view patient profiles without explicit household authorization.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                <div className="font-bold text-sm sm:text-base text-foreground font-sans">Encrypted Transport</div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  All communications and session tokens are protected with modern cryptographic hashing standards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 16. FINAL CTA                                                */}
      {/* ============================================================ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="rounded-3xl border border-primary/30 bg-linear-to-b from-card via-card to-primary/[0.04] p-8 sm:p-14 lg:p-16 text-center space-y-6 shadow-sm">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="font-itim text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight">
              Take control of your family's vaccination journey.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Keep records organized, stay on schedule, and access trusted vaccination assistance in one place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button asChild size="lg" variant="cyan" className="font-semibold text-base px-8 h-12 shadow-sm">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12 font-medium px-6">
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>

          <div className="pt-2 text-xs sm:text-sm text-muted-foreground font-mono">
            Free for families &bull; Setup in under 60 seconds
          </div>
        </div>
      </section>

    </div>
  );
}
