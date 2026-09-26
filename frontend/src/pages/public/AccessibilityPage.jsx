import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Smartphone, Keyboard, Volume2, Type, Mail } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <LegalPageLayout
      badge="Digital Inclusion"
      title="Accessibility Commitment"
      subtitle="Ensuring VaxAssist AI is usable, readable, and navigable for parents, caregivers, and healthcare workers of all abilities."
      lastUpdated="September 2026"
    >
      {/* Overview Card */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <Eye className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Our Standard:</strong> Healthcare tools must be barrier-free. We continually audit and improve our interface to support diverse interaction needs, including assistive technologies, keyboard-only navigation, and high-contrast environments.
        </span>
      </div>

      {/* 1. Responsive & Fluid Design */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <span>1. Responsive &amp; Adaptable Layouts</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              VaxAssist AI is engineered with flexible responsive layouts that adapt smoothly across device viewports starting from 375px mobile screens up to multi-monitor desktop workspaces.
            </p>
            <p>
              Interface components respect browser zoom settings up to 200% without horizontal clipping or loss of critical scheduling controls.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. Keyboard Navigation */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-primary" />
          <span>2. Complete Keyboard Navigation</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Every interactive element — buttons, navigation links, modals, dialog close buttons, and tab controls — is reachable and actionable using standard keyboard keystrokes (<kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Tab</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Shift+Tab</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Space</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Escape</kbd>).
            </p>
            <p>
              We provide visible focus rings to ensure keyboard users can track their position on the page effortlessly.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 3. Screen-Reader Compatibility */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <span>3. Screen-Reader Support</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              We utilize semantic HTML5 elements (&lt;header&gt;, &lt;main&gt;, &lt;nav&gt;, &lt;section&gt;, &lt;aside&gt;, &lt;button&gt;) and ARIA labels on icon buttons to provide screen-reader engines with clear landmarks and role descriptions.
            </p>
            <p>
              Visual status badges (such as "Overdue", "Due Soon", and "Completed") are paired with descriptive text equivalents rather than relying exclusively on color.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. Readable Content & Contrast */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <span>4. High Contrast &amp; Legibility</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Typography is paired with legible font sizes and line heights. Both light and dark theme palettes are designed to meet standard contrast ratios between foreground text and surface backgrounds.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 5. Accessibility Feedback */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sora text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <span>5. Accessibility Feedback &amp; Assistance</span>
        </h2>
        <Card className="border border-border/80">
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              If you encounter an accessibility barrier or have difficulty using any feature on VaxAssist AI, please contact our team:
            </p>
            <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center gap-2 text-xs">
              <Mail className="h-4 w-4 text-primary" />
              <span>
                <strong>Accessibility Coordinator:</strong>{' '}
                <span className="text-foreground font-mono">support@vaxassist.ai</span>{' '}
                <span className="text-muted-foreground text-[10px]">(placeholder)</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Please include the page URL, assistive technology used, and the nature of the issue so we can address it promptly.
            </p>
          </CardContent>
        </Card>
      </section>
    </LegalPageLayout>
  );
}
