import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Settings,
  Users,
  Heart,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Save,
  Check,
  Building2,
  Smartphone,
  Info
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { INITIAL_USER_PROFILE } from '@/data/mockSettingsData';
import { INITIAL_FAMILY_MEMBERS, BLOOD_GROUPS, GENDER_OPTIONS } from '@/data/mockFamilyData';

export default function ProfilePage() {
  const navigate = useNavigate();

  // Profile State
  const [profile, setProfile] = useState(INITIAL_USER_PROFILE);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    firstName: profile.name.split(' ')[0] || '',
    lastName: profile.name.split(' ').slice(1).join(' ') || '',
    email: profile.email,
    phone: profile.phone,
    dob: profile.dob,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode,
    emergencyName: profile.emergencyContact.name,
    emergencyRelation: profile.emergencyContact.relationship,
    emergencyPhone: profile.emergencyContact.phone,
  });

  const [formErrors, setFormErrors] = useState({});

  const handleOpenEdit = () => {
    setFormData({
      firstName: profile.name.split(' ')[0] || '',
      lastName: profile.name.split(' ').slice(1).join(' ') || '',
      email: profile.email,
      phone: profile.phone,
      dob: profile.dob,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      emergencyName: profile.emergencyContact.name,
      emergencyRelation: profile.emergencyContact.relationship,
      emergencyPhone: profile.emergencyContact.phone,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 10) {
      errors.phone = 'Phone must be at least 10 digits';
    }
    if (!formData.dob) errors.dob = 'Date of birth is required';
    if (!formData.emergencyName.trim()) errors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyPhone.trim()) {
      errors.emergencyPhone = 'Emergency contact phone is required';
    } else if (formData.emergencyPhone.replace(/[^0-9]/g, '').length < 10) {
      errors.emergencyPhone = 'Emergency phone must be at least 10 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        emergencyContact: {
          name: formData.emergencyName.trim(),
          relationship: formData.emergencyRelation.trim(),
          phone: formData.emergencyPhone.trim(),
        },
      }));
      setIsSaving(false);
      setIsEditOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Personal Profile"
        subtitle="Manage your personal identification, clinical identity, and family account credentials."
        breadcrumbs={[
          { label: 'Dashboard', href: '/patient/dashboard' },
          { label: 'Profile' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="gap-2 text-xs"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              Account Settings
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenEdit}
              className="gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </div>
        }
      />

      {/* Save Success Alert Notification */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Profile details successfully updated!</p>
            <p className="text-xs opacity-90">All changes have been synchronized across your household records.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveSuccess(false)}
            className="h-7 px-2 text-xs hover:bg-emerald-500/10"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 2. User Overview Hero Card */}
      <Card className="border border-border/80 shadow-sm overflow-hidden bg-card">
        <div className="h-28 bg-gradient-to-r from-primary/15 via-blue-500/10 to-teal-500/15 relative">
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-primary/20 text-primary text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verified Identity
            </Badge>
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">
              UID: {profile.id}
            </Badge>
          </div>
        </div>

        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                    {profile.avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" title="Active Account" />
              </div>
              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{profile.name}</h2>
                  <StatusBadge status="COMPLETED" label="Active & Verified" className="text-xs py-0.5" />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <span>{profile.roleLabel}</span>
                  <span>•</span>
                  <span>Member since Jan 2026</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="gap-1.5 text-xs h-9 px-3"
              >
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                Edit Info
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/family')}
                className="gap-1.5 text-xs h-9 px-3"
              >
                <Users className="w-3.5 h-3.5" />
                Family Roster
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Primary Email</div>
                <div className="text-xs font-medium text-foreground truncate" title={profile.email}>{profile.email}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Confirmed
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mobile Contact</div>
                <div className="text-xs font-medium text-foreground truncate">{profile.phone}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OTP Verified
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Family Household</div>
                <div className="text-xs font-medium text-foreground">{INITIAL_FAMILY_MEMBERS.length} Registered Members</div>
                <div className="text-[10px] text-muted-foreground">Admin Access</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">National Health ID (ABHA)</div>
                <div className="text-xs font-mono font-medium text-foreground">91-8842-9901-2311</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Linked to CoWIN
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Detailed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Personal & Address Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal & Demographic Details */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Personal & Demographic Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Legal identification matching government immunization records.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="h-8 text-xs text-primary gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Full Name</span>
                  <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Date of Birth</span>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {profile.dob} (Age 38)
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Gender</span>
                  <p className="text-sm font-semibold text-foreground">{profile.gender}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Blood Group</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-bold">
                      {profile.bloodGroup}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Account Role</span>
                  <p className="text-sm font-semibold text-foreground">
                    {profile.roleLabel} <span className="text-xs text-muted-foreground font-normal">({profile.role})</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Account Status</span>
                  <div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      {profile.account_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Residential Details */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Contact & Residential Address
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Primary domicile used for locating nearest immunization clinics.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="h-8 text-xs text-primary gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Email Address</span>
                  <p className="text-sm font-semibold text-foreground">{profile.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Mobile Phone</span>
                  <p className="text-sm font-semibold text-foreground">{profile.phone}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Street Address</span>
                <p className="text-sm font-medium text-foreground">{profile.address}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">City</span>
                  <p className="text-sm font-semibold text-foreground">{profile.city}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">State</span>
                  <p className="text-sm font-semibold text-foreground">{profile.state}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">PIN Code</span>
                  <p className="text-sm font-mono font-semibold text-foreground">{profile.pincode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Information */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Emergency Contact Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Designated contact reached during critical immunization or adverse event notices.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="h-8 text-xs text-primary gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Contact Person</span>
                  <p className="text-sm font-semibold text-foreground">{profile.emergencyContact.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Relationship</span>
                  <p className="text-sm font-semibold text-foreground">{profile.emergencyContact.relationship}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Emergency Phone</span>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {profile.emergencyContact.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Household & Quick Links */}
        <div className="space-y-6">
          {/* Linked Family Members */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Household Members
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {INITIAL_FAMILY_MEMBERS.length} dependents linked to this profile
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/family')}
                  className="h-7 text-xs text-primary gap-1"
                >
                  View All
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/50">
              {INITIAL_FAMILY_MEMBERS.map((member) => (
                <div
                  key={member.id}
                  onClick={() => navigate(`/family/${member.id}`)}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.avatarBg}`}>
                      {member.avatarFallback}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        {member.name}
                        {member.relationship === 'Self' && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">Self</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {member.relationship} • {member.age}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {member.progress}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Covered</div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-3 bg-muted/20 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => navigate('/family')}
              >
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Manage Family Profiles
              </Button>
            </CardFooter>
          </Card>

          {/* Primary Healthcare Provider */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Assigned Health Center
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Indiranagar Urban Primary Health Centre (UPHC)</p>
                <p className="text-xs text-muted-foreground">HAL 2nd Stage, Indiranagar, Bengaluru, 560038</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Assigned ANM / Worker:</span>
                  <span className="font-medium text-foreground">Pooja Sharma (ANM-401)</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact:</span>
                  <span className="font-medium text-foreground">+91 98450 11234</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access Overview */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Account Security Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Two-Factor Authentication:</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                  Enabled (SMS)
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Sessions:</span>
                <span className="font-semibold text-foreground">3 devices</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password last updated:</span>
                <span className="text-foreground">June 15, 2026</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings?tab=security')}
                className="w-full text-xs gap-1.5 mt-2"
              >
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Manage Security Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Edit Profile Modal Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Personal Profile
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update your personal identification and emergency contact credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Rajesh"
                  className={formErrors.firstName ? 'border-destructive' : ''}
                />
                {formErrors.firstName && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Verma"
                  className={formErrors.lastName ? 'border-destructive' : ''}
                />
                {formErrors.lastName && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  className={formErrors.email ? 'border-destructive' : ''}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98112 45901"
                  className={formErrors.phone ? 'border-destructive' : ''}
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* DOB, Gender, Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-xs font-semibold">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className={formErrors.dob ? 'border-destructive' : ''}
                />
                {formErrors.dob && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.dob}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-semibold">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bloodGroup" className="text-xs font-semibold">
                  Blood Group
                </Label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                >
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Residential Domicile
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold">
                  Street Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Apartment, building, and street name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold">PIN Code</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g. 560038"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="emergencyName" className="text-xs font-semibold">
                    Contact Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="e.g. Sunita Verma"
                    className={formErrors.emergencyName ? 'border-destructive' : ''}
                  />
                  {formErrors.emergencyName && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.emergencyName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emergencyRelation" className="text-xs font-semibold">
                    Relationship
                  </Label>
                  <Input
                    id="emergencyRelation"
                    value={formData.emergencyRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                    placeholder="e.g. Spouse / Sibling"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emergencyPhone" className="text-xs font-semibold">
                    Emergency Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="e.g. +91 98112 45902"
                    className={formErrors.emergencyPhone ? 'border-destructive' : ''}
                  />
                  {formErrors.emergencyPhone && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.emergencyPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
