import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="w-full bg-[#05070D] text-neutral-300 border-t border-white/10 transition-colors relative overflow-hidden">
      {/* Subtle background ambient radial glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/5 blur-3xl pointer-events-none rounded-full" 
        aria-hidden="true" 
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-14 sm:pt-20">
        {/* Top Section: Brand Info + Categorized Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-12 sm:pb-16"
        >
          {/* Brand & Mission Column */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block group">
              <BrandLogo size="md" />
            </Link>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed font-sans">
              Modern digital immunization management and AI-assisted healthcare platform.
              Organizing family immunization timelines, automated reminders, and trusted clinical guidance.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
              <span>Grounded in National Immunization Schedules (NIS)</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Product Column */}
            <div className="space-y-3.5 text-xs sm:text-sm">
              <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                Product
              </h4>
              <ul className="space-y-2.5 text-neutral-400">
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
                <li>
                  <Link to="/system-test" className="hover:text-primary transition-colors">
                    System Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Medical Column */}
            <div className="space-y-3.5 text-xs sm:text-sm">
              <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                Legal &amp; Policy
              </h4>
              <ul className="space-y-2.5 text-neutral-400">
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/medical-disclaimer" className="hover:text-primary transition-colors">
                    Medical Disclaimer
                  </Link>
                </li>
                <li>
                  <Link to="/ai-transparency" className="hover:text-primary transition-colors">
                    AI Transparency
                  </Link>
                </li>
              </ul>
            </div>

            {/* Trust & Support Column */}
            <div className="space-y-3.5 text-xs sm:text-sm col-span-2 sm:col-span-1">
              <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                Trust &amp; Access
              </h4>
              <ul className="space-y-2.5 text-neutral-400">
                <li>
                  <Link to="/security" className="hover:text-primary transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-primary transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="hover:text-primary transition-colors">
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* BALANCED GHOST / OUTLINE BRAND TEXT                          */}
        {/* Refined outline stroke with vertical fade                    */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full overflow-hidden select-none pointer-events-none py-6 sm:py-8"
        >
          <div
            className="w-full flex items-center justify-center overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 90%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 90%)',
            }}
          >
            <span
              className="font-sora font-extrabold uppercase text-transparent whitespace-nowrap text-center leading-none tracking-[0.18em] sm:tracking-[0.26em] text-3xl sm:text-5xl lg:text-6xl"
              style={{
                WebkitTextStroke: '1.1px rgba(255, 255, 255, 0.28)',
              }}
            >
              VAXASSIST AI
            </span>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* BOTTOM BAR: COPYRIGHT & ESSENTIAL QUICK LINKS               */}
        {/* Exact reference image placement: Left copyright, Right links*/}
        {/* ============================================================ */}
        <div className="pt-6 pb-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p className="font-sans">
            &copy; {currentYear} VaxAssist AI. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-sans">
            <Link
              to="/security"
              className="hover:text-white transition-colors"
            >
              Security
            </Link>
            <Link
              to="/terms"
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
