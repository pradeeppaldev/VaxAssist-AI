import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import ThemeToggle from '@/components/common/ThemeToggle';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, getDashboardPath } = useAuth();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faq' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-colors">
      <div className="container mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Official Brand Logo */}
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo size="md" subtitle="Digital Immunization Management" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-3.5 py-2 text-sm font-medium rounded-lg transition-colors font-sans",
                isActive(link.href)
                  ? "bg-primary/10 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right CTAs & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Button asChild size="default" variant="cyan" className="font-semibold gap-2 shadow-xs">
              <Link to={getDashboardPath()}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2.5">
              <Button asChild variant="ghost" size="default" className="font-semibold text-sm">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="default" variant="cyan" className="font-semibold gap-2 shadow-xs">
                <Link to="/register">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Actions: Theme Toggle + shadcn Sheet Menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground h-10 w-10"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6 flex flex-col justify-between bg-card">
              <div className="space-y-6">
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <SheetTitle className="flex items-center">
                    <BrandLogo size="sm" />
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col space-y-1.5 pt-2">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        to={link.href}
                        className={cn(
                          "px-3.5 py-3 rounded-lg text-base font-medium transition-colors font-sans",
                          isActive(link.href)
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>

              {/* Mobile Menu Footer CTAs */}
              <div className="pt-6 border-t border-border flex flex-col gap-3">
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <Button asChild variant="cyan" size="lg" className="w-full font-semibold">
                      <Link to={getDashboardPath()}>
                        Go to Dashboard
                      </Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" size="lg" className="w-full text-sm font-semibold">
                        <Link to="/login">Sign In</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="cyan" size="lg" className="w-full font-semibold">
                        <Link to="/register">Get Started</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
