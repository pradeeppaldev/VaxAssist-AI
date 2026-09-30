import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { TooltipProvider } from './components/ui/tooltip';
import ClickSpark from './components/ui/ClickSpark';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vaxassist_theme">
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <DemoModeProvider>
            <AuthProvider>
              <ClickSpark
                sparkColor="#3b82f6"
                sparkSize={10}
                sparkRadius={16}
                sparkCount={8}
                duration={400}
              >
                <AppRoutes />
              </ClickSpark>
            </AuthProvider>
          </DemoModeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
