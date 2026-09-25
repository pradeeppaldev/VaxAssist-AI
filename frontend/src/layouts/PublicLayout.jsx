import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import Footer from '../components/common/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
