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
            <div className="mt-6 pt-5 border-t border-border space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Quick Demo Accounts:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@vaxassist.ai', 'Admin@VaxAssist2026')}
                  className="text-left rounded-lg bg-muted/60 hover:bg-muted p-2 text-xs border border-border transition text-foreground font-mono cursor-pointer"
                >
                  <div className="font-semibold text-purple-600 dark:text-purple-400">Admin</div>
                  <div className="text-[10px] text-muted-foreground truncate">admin@vaxassist.ai</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('priya.sharma@apollohealth.org', 'Doctor@VaxAssist2026')}
                  className="text-left rounded-lg bg-muted/60 hover:bg-muted p-2 text-xs border border-border transition text-foreground font-mono cursor-pointer"
                >
                  <div className="font-semibold text-blue-600 dark:text-blue-400">Healthcare</div>
                  <div className="text-[10px] text-muted-foreground truncate">priya.sharma@apollo...</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('rajesh.verma@gmail.com', 'Family@VaxAssist2026')}
                  className="text-left rounded-lg bg-muted/60 hover:bg-muted p-2 text-xs border border-border transition text-foreground font-mono cursor-pointer"
                >
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">Patient</div>
                  <div className="text-[10px] text-muted-foreground truncate">rajesh.verma@gmail...</div>
                </button>
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
