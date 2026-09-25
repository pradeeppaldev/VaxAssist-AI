import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    { num: "01", title: "Create Your Account", desc: "Register as a parent/family caregiver or submit your healthcare credentials for clinical verification." },
    { num: "02", title: "Add Family Profiles", desc: "Enter details for your children, spouse, or dependents with their verified date of birth." },
    { num: "03", title: "System Generates Schedule", desc: "The deterministic engine produces exact immunization due dates based on the National Immunization Schedule." },
    { num: "04", title: "Log Historical Doses", desc: "Input past vaccines from physical records to establish your family's baseline compliance." },
    { num: "05", title: "Receive Automated Reminders", desc: "Get notifications ahead of time to schedule pediatric visits without missing critical windows." },
    { num: "06", title: "Consult AI Assistant", desc: "Ask questions on vaccine safety, intervals, or catch-up pathways backed by official WHO and UIP guidelines." },
    { num: "07", title: "Verify & Export", desc: "Have certified healthcare workers record batch numbers and export compliant reports anytime." },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-wider font-mono text-xs">
          End-to-End Workflow
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
          How VaxAssist AI Works
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          A streamlined 7-step journey designed to ensure zero missed vaccinations for your loved ones.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s, idx) => (
          <Card key={idx} className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold font-mono text-base">
                {s.num}
              </span>
              <div className="space-y-1 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground font-sans">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button asChild size="lg" variant="cyan" className="gap-2 font-semibold px-8 h-12 shadow-xs">
          <Link to="/register">
            <span>Get Started Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
