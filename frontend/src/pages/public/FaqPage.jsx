import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight } from 'lucide-react';

export default function FaqPage() {
  const faqs = [
    {
      id: "faq-1",
      q: "What is VaxAssist AI?",
      a: "VaxAssist AI is a modern digital vaccination management platform providing deterministic schedule calculations, smart reminders, and clinical AI guidance for families and healthcare professionals."
    },
    {
      id: "faq-2",
      q: "Which immunization schedule does VaxAssist follow?",
      a: "By default, VaxAssist strictly follows India's Universal Immunization Programme (UIP / NIS), including endemic disease schedules like Japanese Encephalitis (JE). Optional private regimens (such as IAP recommendations) can also be toggled as needed."
    },
    {
      id: "faq-3",
      q: "Can I manage multiple family members on one account?",
      a: "Yes. VaxAssist allows you to create individual profiles for multiple children, your spouse, yourself, or elderly parents under a single family household, with independent age-calculated schedules."
    },
    {
      id: "faq-4",
      q: "How does the AI Assistant verify its answers?",
      a: "The AI Assistant uses a grounded retrieval mechanism referencing official medical guidelines (WHO, UIP, MoHFW) alongside the user's active family member schedule data, preventing generic or hallucinatory answers."
    },
    {
      id: "faq-5",
      q: "Are my family's medical records secure?",
      a: "Yes. All records are isolated per household with role-based access control, cryptographic password hashing, and encrypted API transport. Healthcare workers only access records with explicit authorization."
    },
    {
      id: "faq-6",
      q: "How can healthcare workers get verified?",
      a: "Healthcare professionals submit their registration with professional medical license and affiliation details, which undergo administrative verification before clinical permissions are activated."
    }
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-wider font-mono text-xs">
          Help &amp; Answers
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Find answers to common questions regarding schedules, accuracy, security, and verification.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm p-6 sm:p-8">
        <Accordion type="single" collapsible defaultValue="faq-1" className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b border-border/80 last:border-b-0 py-1">
              <AccordionTrigger className="text-base sm:text-lg font-semibold text-foreground font-sans hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      {/* Helpful Contact Box */}
      <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-4 max-w-2xl mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto">
          <HelpCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground font-sans">Still have questions?</h3>
          <p className="text-sm text-muted-foreground">
            Our AI Assistant and documentation are ready to guide your family's immunization steps.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Button asChild variant="cyan" className="font-semibold gap-1.5">
            <Link to="/register">
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/how-it-works">Learn How It Works</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
