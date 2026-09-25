import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vaxassist_theme">
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
