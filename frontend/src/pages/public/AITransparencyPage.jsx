import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Database, AlertCircle, CheckCircle, Cpu, FileText } from 'lucide-react';

export default function AITransparencyPage() {
  return (
    <LegalPageLayout
      badge="AI System Architecture"
      title="AI Transparency & Grounding Notice"
      subtitle="How artificial intelligence and knowledge retrieval are implemented within VaxAssist AI, and how we approach safety and accuracy."
      lastUpdated="September 2026"
    >
      {/* Overview Card */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Our Commitment:</strong> We believe healthcare tools require complete transparency. Here we openly explain where AI is active, how knowledge retrieval functions, and the boundaries of automated assistance.
        </span>
      </div>

      {/* 1. Where AI is Used */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <span>1. Where AI is Used in VaxAssist AI</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Artificial intelligence is used in specific, bounded areas of the platform:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>VaxAssist AI Assistant:</strong> A conversational interface answering user inquiries regarding immunization schedules, dose intervals, and general vaccine information.</li>
              <li><strong>Contextual Summaries:</strong> Generating human-readable explanations of complex schedule timelines for specific age groups.</li>
              <li><strong>Catch-up Guidance Suggestions:</strong> Identifying potential missed doses based on birth dates and comparing them against national guideline timelines.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 2. How Retrieval-Augmented Generation (RAG) Works */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <span>2. How Grounded Retrieval (RAG) Operates</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Unlike generic chatbots that guess from open internet forums, VaxAssist AI employs <strong>Retrieval-Augmented Generation (RAG)</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1.5">
                <span className="text-[11px] font-mono font-bold text-primary">01. Official Sources</span>
                <p className="text-xs text-foreground font-semibold">Indexed Guidelines</p>
                <p className="text-[11px] text-muted-foreground">Public documents from national schedules (UIP/NIS) are chunked and indexed.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1.5">
                <span className="text-[11px] font-mono font-bold text-primary">02. Semantic Match</span>
                <p className="text-xs text-foreground font-semibold">Source Retrieval</p>
                <p className="text-[11px] text-muted-foreground">Your query retrieves relevant official text segments rather than unverified blog posts.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1.5">
                <span className="text-[11px] font-mono font-bold text-primary">03. Grounded Answer</span>
                <p className="text-xs text-foreground font-semibold">Cited Generation</p>
                <p className="text-[11px] text-muted-foreground">The response is synthesized strictly using retrieved evidence alongside family age context.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Error Potential and Hallucination Risks */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <span>3. Limitations &amp; Potential for Inaccuracies</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              While RAG substantially reduces hallucinations compared to raw foundation models, generative AI systems can still:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Synthesize answers with subtly incorrect age ranges or timing intervals.</li>
              <li>Misinterpret atypical vaccination histories or multiple co-administered doses.</li>
              <li>Omit specific medical contraindications relevant to rare health conditions.</li>
            </ul>
            <p>
              For these reasons, VaxAssist AI displays citations and confidence indicators alongside responses, encouraging direct verification.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. Verification & Clinical Safety */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-status-completed" />
          <span>4. Human Clinical Verification Policy</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI maintains a strict <strong>Human-in-the-Loop</strong> policy:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>No AI model can automatically prescribe, schedule, or certify clinical vaccinations.</li>
              <li>All dose administrations must be confirmed by the administering clinician or family guardian.</li>
              <li>Critical questions must always be confirmed with a licensed pediatrician before vaccine administration.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
