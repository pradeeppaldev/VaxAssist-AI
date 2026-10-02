import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/common/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      if (from) {
        navigate(from, { replace: true });
      } else {
        const role = result.user.role;
        if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
        else if (role === 'HEALTHCARE_WORKER') navigate('/healthcare/dashboard', { replace: true });
        else navigate('/patient/dashboard', { replace: true });
      }
    } else {
      setError(result.error);
    }
  };

  const fillCredentials = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header with Brand Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
            <BrandLogo size="lg" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to access your family immunization hub or clinical portal
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="cyan"
                className="w-full font-semibold gap-2 mt-2 h-11 text-base shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Quick Demo Accounts</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">Click to auto-fill</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Patient / Family */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fillCredentials('rajesh.sharma@vaxassist.demo', 'Rajesh@Vax2026!')}
                  onKeyDown={(e) => e.key === 'Enter' && fillCredentials('rajesh.sharma@vaxassist.demo', 'Rajesh@Vax2026!')}
                  className={`text-left rounded-lg p-2.5 text-xs border transition cursor-pointer ${
                    email === 'rajesh.sharma@vaxassist.demo'
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-muted/50 hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Patient / Family
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
                      Sharma Family Household
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-muted-foreground">
                    <span className="text-foreground font-medium">rajesh.sharma@vaxassist.demo</span>
                    <span className="text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/40">
                      Rajesh@Vax2026!
                    </span>
                  </div>
                </div>

                {/* 2. Healthcare Worker (with Alt Toggle) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fillCredentials('dr.anjali.deshmukh@vaxassist.demo', 'DrAnjali@Vax2026!')}
                  onKeyDown={(e) => e.key === 'Enter' && fillCredentials('dr.anjali.deshmukh@vaxassist.demo', 'DrAnjali@Vax2026!')}
                  className={`text-left rounded-lg p-2.5 text-xs border transition cursor-pointer ${
                    email === 'dr.anjali.deshmukh@vaxassist.demo' || email === 'dr.vikram.patil@vaxassist.demo'
                      ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
                      : 'bg-muted/50 hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      Healthcare Worker
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
                      {email === 'dr.vikram.patil@vaxassist.demo' ? 'KEM Hospital' : 'Lilavati Hospital'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-muted-foreground">
                    <span className="text-foreground font-medium">
                      {email === 'dr.vikram.patil@vaxassist.demo' ? 'dr.vikram.patil@vaxassist.demo' : 'dr.anjali.deshmukh@vaxassist.demo'}
                    </span>
                    <span className="text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/40">
                      {email === 'dr.vikram.patil@vaxassist.demo' ? 'DrVikram@Vax2026!' : 'DrAnjali@Vax2026!'}
                    </span>
                  </div>
                  {/* Alternative HCW Quick Option */}
                  <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Alt Clinician:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fillCredentials('dr.vikram.patil@vaxassist.demo', 'DrVikram@Vax2026!');
                      }}
                      className="text-primary hover:underline font-medium font-sans"
                    >
                      Use Dr. Vikram Patil (KEM Hospital)
                    </button>
                  </div>
                </div>

                {/* 3. Administrator */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fillCredentials('admin@vaxassist.demo', 'Admin@Vax2026!')}
                  onKeyDown={(e) => e.key === 'Enter' && fillCredentials('admin@vaxassist.demo', 'Admin@Vax2026!')}
                  className={`text-left rounded-lg p-2.5 text-xs border transition cursor-pointer ${
                    email === 'admin@vaxassist.demo'
                      ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30'
                      : 'bg-muted/50 hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                      Administrator
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
                      State Immunization HQ / MoHFW
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-muted-foreground">
                    <span className="text-foreground font-medium">admin@vaxassist.demo</span>
                    <span className="text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/40">
                      Admin@Vax2026!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
