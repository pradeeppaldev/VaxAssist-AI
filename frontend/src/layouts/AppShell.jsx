import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppHeader from './AppHeader';
import { OfflineNoticeBanner } from '@/components/common/OfflineNoticeBanner';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top Application Header */}
      <AppHeader onToggleMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Global Offline and Sync Alert Banner */}
      <OfflineNoticeBanner />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Desktop Sidebar (visible on md and above) */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <AppSidebar />
          </div>
        </div>

        {/* Mobile Navigation Drawer Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-card">
            <AppSidebar onNavClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area with Framer Motion Page Transition */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <ErrorBoundary>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible on < md) */}
      <MobileBottomNav />
    </div>
  );
}

export default AppShell;
