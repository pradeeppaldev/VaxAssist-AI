import React, { useState } from 'react';
import LegalPageLayout from './LegalPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  Lock,
  Sparkles,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  const contactChannels = [
    {
      title: 'General Support',
      desc: 'Account assistance, schedule navigation, and general questions.',
      email: 'support@vaxassist.ai',
      icon: MessageSquare,
    },
    {
      title: 'Privacy Questions',
      desc: 'Inquiries regarding data retention, export, or personal data rights.',
      email: 'privacy@vaxassist.ai',
      icon: ShieldCheck,
    },
    {
      title: 'Security Issues',
      desc: 'Responsible vulnerability disclosures and platform security reports.',
      email: 'security@vaxassist.ai',
      icon: Lock,
    },
    {
      title: 'AI Feedback',
      desc: 'Suggestions on AI accuracy, knowledge citations, and grounded responses.',
      email: 'support@vaxassist.ai',
      icon: Sparkles,
    },
    {
      title: 'Legal & Governance',
      desc: 'Terms of service, statutory requirements, and formal notices.',
      email: 'legal@vaxassist.ai',
      icon: FileText,
    },
  ];

  return (
    <LegalPageLayout
      badge="Communication Hub"
      title="Contact VaxAssist AI"
      subtitle="Have questions about immunization tracking, data privacy, or platform assistance? Our team is here to assist."
      lastUpdated="September 2026"
    >
      {/* Notice on Placeholder Channels */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Notice:</strong> The email inboxes listed below are active communication channels during development. For immediate clinical or medical advice, please consult your primary pediatrician or local healthcare center directly.
        </span>
      </div>

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contactChannels.map((channel, idx) => {
          const Icon = channel.icon;
          return (
            <Card key={idx} className="border border-border/80 bg-card hover:border-primary/40 transition-colors">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground font-sora">{channel.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{channel.desc}</p>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs border-t border-border/60">
                  <span className="font-mono text-primary font-medium">{channel.email}</span>
                  <span className="text-[10px] text-muted-foreground">(placeholder)</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Message Form */}
      <Card className="border border-border/80 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold font-sora text-foreground">
            Send an Online Message
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Submit a message directly to our support team and we will respond via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-status-completed-bg text-status-completed flex items-center justify-center mx-auto border border-status-completed/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Thank you for contacting us!</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                We have received your message regarding <strong>{formData.subject || 'your inquiry'}</strong>. A team member will review it and reply to {formData.email}.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', category: 'general', subject: '', message: '' });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contactName" className="text-xs font-semibold">Your Full Name *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="name@example.com"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactSubject" className="text-xs font-semibold">Subject *</Label>
                <Input
                  id="contactSubject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Question regarding vaccine reminder intervals"
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactMessage" className="text-xs font-semibold">Message Content *</Label>
                <Textarea
                  id="contactMessage"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your inquiry or feedback in detail..."
                  className="text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="gap-2 font-semibold text-xs sm:text-sm">
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </LegalPageLayout>
  );
}
