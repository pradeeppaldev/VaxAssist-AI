import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Stethoscope, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  BadgeCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/common/BrandLogo';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('PATIENT'); // 'PATIENT' or 'HEALTHCARE_WORKER'
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicOrHospital, setClinicOrHospital] = useState('');

  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (role === 'HEALTHCARE_WORKER' && !licenseNumber.trim()) {
      setError('Medical License Number is required for Healthcare Worker registration.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      confirm_password: confirmPassword,
      role,
      license_number: role === 'HEALTHCARE_WORKER' ? licenseNumber.trim() : null,
      clinic_or_hospital: role === 'HEALTHCARE_WORKER' && clinicOrHospital.trim() ? clinicOrHospital.trim() : null,
    };

    const res = await register(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessInfo({
        role,
        message: res.message,
        email: email.trim(),
      });
    } else {
      setError(res.error);
    }
  };

  if (successInfo) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-border bg-card p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-status-completed/10 text-status-completed mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-sans">
            {successInfo.role === 'HEALTHCARE_WORKER' ? 'Registration Submitted!' : 'Registration Complete!'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {successInfo.message}
          </p>

          {successInfo.role === 'HEALTHCARE_WORKER' && (
            <div className="rounded-xl bg-status-catchup-bg border border-status-catchup/30 p-4 text-xs sm:text-sm text-status-catchup-fg text-left space-y-1">
              <strong>Account Status: PENDING VERIFICATION</strong>
              <p className="leading-relaxed">
                Your medical credentials have been forwarded to the Admin verification queue. Once approved, your clinical portal access will be unlocked.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <Button asChild variant="cyan" size="lg" className="w-full font-semibold">
              <Link to="/login">Proceed to Sign In</Link>
            </Button>
            <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
              Back to Home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Header with Brand Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
            <BrandLogo size="lg" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
              Create an Account
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select your account type and begin managing verified immunization records
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Account Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  I am registering as:
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('PATIENT')}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition cursor-pointer",
                      role === 'PATIENT'
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                    )}
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs sm:text-sm">Family / Caregiver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('HEALTHCARE_WORKER')}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition cursor-pointer",
                      role === 'HEALTHCARE_WORKER'
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                    )}
                  >
                    <Stethoscope className="h-5 w-5 mb-1" />
                    <span className="text-xs sm:text-sm">Healthcare Worker</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'HEALTHCARE_WORKER' ? 'Dr. Ananya Roy' : 'Priya Sharma'}
                    className="pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Healthcare-specific fields */}
              {role === 'HEALTHCARE_WORKER' && (
                <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseNumber" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Medical License Number</span>
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <Input
                        id="licenseNumber"
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. MCI-2021-998811"
                        className="pl-10 h-11 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="clinicOrHospital" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                      Clinic or Hospital Affiliation (Optional)
                    </Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <Input
                        id="clinicOrHospital"
                        type="text"
                        value={clinicOrHospital}
                        onChange={(e) => setClinicOrHospital(e.target.value)}
                        placeholder="City Children's Hospital"
                        className="pl-10 h-11 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                    Password
                  </Label>
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11 text-sm"
                    />
                  </div>
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
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>
                    {role === 'HEALTHCARE_WORKER' ? 'Submit for Clinical Verification' : 'Create Free Account'}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
