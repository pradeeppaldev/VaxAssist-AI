import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 text-foreground transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-border/80">
          
          {/* Brand & Mission Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <BrandLogo size="md" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed font-sans">
              Modern digital vaccination management and AI-assisted healthcare platform.
              Organizing family immunization timelines, automated reminders, and trusted clinical guidance.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-mono">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
              <span>Grounded in National Immunization Schedules (NIS)</span>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-3.5 text-sm">
            <h4 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">
              Product
            </h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <Link to="/features" className="hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div className="space-y-3.5 text-sm">
            <h4 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">
              Platform
            </h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <Link to="/patient/dashboard" className="hover:text-primary transition-colors">
                  Family Care
                </Link>
              </li>
              <li>
                <Link to="/healthcare/dashboard" className="hover:text-primary transition-colors">
                  Healthcare Workers
                </Link>
              </li>
              <li>
                <Link to="/ai-assistant" className="hover:text-primary transition-colors">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Project Column */}
          <div className="space-y-3.5 text-sm">
            <h4 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">
              Account &amp; Project
            </h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/system-test" className="hover:text-primary transition-colors">
                  System Diagnostics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Principles */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VaxAssist AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
            <span className="hover:text-foreground transition-colors cursor-default">Healthcare Privacy</span>
            <span className="hover:text-foreground transition-colors cursor-default">Deterministic Scheduling</span>
            <span className="hover:text-foreground transition-colors cursor-default">Verified Knowledge Grounding</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
