import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNavbar from './PublicNavbar';
import Footer from '../components/common/Footer';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <PublicNavbar />
      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
