import React from 'react';
import { ShieldCheck, Calendar, Bell, Sparkles, Users, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-wider font-mono text-xs">
          VaxAssist Architecture
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
          Engineered for Complete Immunization Care
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Explore the core capabilities that keep your family's health safeguarded and verified.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Deterministic UIP Schedules",
            desc: "Immunization timelines calculated strictly from date of birth with zero ambiguity or guesswork.",
            icon: Calendar,
          },
          {
            title: "Multi-Profile Family Care",
            desc: "Manage multiple children, dependents, and parents within a single unified household account.",
            icon: Users,
          },
          {
            title: "Intelligent Reminders",
            desc: "Timely alerts before critical vaccination milestones and automated overdue follow-up sequences.",
            icon: Bell,
          },
          {
            title: "AI Knowledge Assistance",
            desc: "Vaccination questions answered using verified health guidelines and active family context.",
            icon: Sparkles,
          },
          {
            title: "Clinical Verification",
            desc: "Healthcare workers certify doses with batch tracking, site, and administration details.",
            icon: ShieldCheck,
          },
          {
            title: "Official Compliance Reports",
            desc: "Export digital records formatted for school enrollments, daycare, and travel verification.",
            icon: FileText,
          },
        ].map((f, i) => (
          <Card key={i} className="border-border bg-card hover:border-primary/40 transition-colors shadow-2xs">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-foreground font-sans">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-8 sm:p-10 text-center space-y-4 max-w-2xl mx-auto shadow-2xs">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground font-sans">Ready to start tracking?</h3>
        <p className="text-sm text-muted-foreground">Create your free account in under 60 seconds.</p>
        <div className="pt-2">
          <Button asChild size="lg" variant="cyan" className="font-semibold gap-2 shadow-xs">
            <Link to="/register">
              <span>Create Family Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
