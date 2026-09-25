import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Stethoscope, 
  User, 
  MoreVertical, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Activity, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UserCog
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MOCK_ADMIN_USERS } from '@/data/mockAdminData';

export function AdminUsersPage() {
  const [users, setUsers] = useState(MOCK_ADMIN_USERS);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Manage Status Form state
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState(null);

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.organization && u.organization.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.account_status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handlers for Modals
  const handleOpenDetail = (u) => {
    setSelectedUser(u);
    setDetailModalOpen(true);
  };

  const handleOpenManage = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setNewStatus(u.account_status);
    setAuditReason('');
    setManageModalOpen(true);
  };

  const executeStatusUpdate = () => {
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUser.id) {
          const updated = {
            ...u,
            role: newRole,
            account_status: newStatus,
          };
          if (newRole === 'PATIENT') updated.roleLabel = 'Patient / Family';
          if (newRole === 'HEALTHCARE_WORKER') updated.roleLabel = 'Healthcare Professional';
          if (newRole === 'ADMIN') updated.roleLabel = 'System Administrator';
          if (newStatus === 'SUSPENDED') updated.suspendedReason = auditReason || 'Administrative suspension';
          return updated;
        }
        return u;
      })
    );

    setNoticeMessage(`Account for ${selectedUser.name} updated to ${newStatus} (${newRole}).`);
    setManageModalOpen(false);
    setConfirmSuspendOpen(false);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleSaveManageStatus = (e) => {
    e.preventDefault();
    if (newStatus === 'SUSPENDED' && selectedUser?.account_status !== 'SUSPENDED') {
      // Trigger confirmation dialog for suspension
      setConfirmSuspendOpen(true);
    } else {
      executeStatusUpdate();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="User Directory & Permissions" 
          subtitle="Manage user accounts, assign role permissions, and govern platform access."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Users' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Loading user directory and access policies..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="User Directory & Permissions" 
          subtitle="Manage user accounts, assign role permissions, and govern platform access."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Users' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Error Querying Directory" 
          message="Failed to retrieve user records from identity federation service."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="User Directory & Permissions" 
          subtitle="Manage user accounts, assign role permissions, and govern platform access."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Users' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState 
          icon={Users}
          title="No Registered Users Found"
          description="There are currently no registered users matching your criteria."
          actionText="Reset Directory"
          onAction={() => setViewState('normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <PageHeader
        title="User Directory & Permissions"
        subtitle="Manage user accounts, assign role permissions, and govern platform access."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'User Management' },
        ]}
        badge={
          <Badge variant="outline" className="font-mono text-xs">
            {users.length} Users Listed
          </Badge>
        }
      />

      {/* State Inspector Toolbar */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Action Notice Alert */}
      {noticeMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{noticeMessage}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setNoticeMessage(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="PATIENT">Patient / Family</SelectItem>
                  <SelectItem value="HEALTHCARE_WORKER">Healthcare Worker</SelectItem>
                  <SelectItem value="ADMIN">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Quick Filter Counts */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Showing {filteredUsers.length} of {users.length} accounts:</span>
            <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-[11px]">
              {users.filter(u => u.role === 'PATIENT').length} Patients
            </span>
            <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-[11px]">
              {users.filter(u => u.role === 'HEALTHCARE_WORKER').length} Clinicians
            </span>
            <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-[11px]">
              {users.filter(u => u.account_status === 'SUSPENDED').length} Suspended
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Users Display: Table on Desktop, Cards on Mobile */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          description="Try broadening your search term or clearing the active filters."
          actionText="Clear All Filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[280px] font-semibold text-xs text-foreground">User / Contact</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">System Role</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Organization / Account Info</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Last Active</TableHead>
                  <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <RoleBadge role={u.role} label={u.roleLabel} />
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <span className="truncate block max-w-[220px]">
                        {u.organization || 'General Family Account'}
                      </span>
                      {u.location && (
                        <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span>{u.location}</span>
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <StatusBadge status={u.account_status} size="sm" />
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                      {u.lastActive}
                    </TableCell>

                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(u)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManage(u)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <UserCog className="h-3.5 w-3.5 text-primary" />
                          <span>Manage</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Stack (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{u.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.account_status} size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
                  <RoleBadge role={u.role} label={u.roleLabel} />
                  <span className="text-muted-foreground">&bull; Active: {u.lastActive}</span>
                </div>

                <p className="text-xs text-muted-foreground truncate">
                  {u.organization || 'General Family Account'} &bull; {u.location}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(u)}
                    className="flex-1 text-xs gap-1.5 h-8"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Profile</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenManage(u)}
                    className="flex-1 text-xs gap-1.5 h-8"
                  >
                    <UserCog className="h-3.5 w-3.5" />
                    <span>Manage Access</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* User Detail Dialog */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold">User Account Profile</DialogTitle>
                  <StatusBadge status={selectedUser.account_status} size="sm" />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Immutable identity data, registered privileges, and activity logs.
                </DialogDescription>
              </DialogHeader>

              {/* Profile Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3.5">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="h-12 w-12 rounded-full object-cover border border-border shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">{selectedUser.name}</h3>
                    <RoleBadge role={selectedUser.role} label={selectedUser.roleLabel} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{selectedUser.email}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{selectedUser.phone}</span>
                  </p>
                </div>
              </div>

              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">Registered On</span>
                  <div className="font-semibold text-foreground">{selectedUser.createdDate}</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">Last Active Session</span>
                  <div className="font-mono font-semibold text-foreground">{selectedUser.lastActive}</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">Location</span>
                  <div className="font-medium text-foreground">{selectedUser.location || 'Not Specified'}</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">Identity ID</span>
                  <div className="font-mono text-primary font-bold">{selectedUser.id}</div>
                </div>
              </div>

              {/* Role Specific Details */}
              {selectedUser.role === 'PATIENT' && selectedUser.dependents && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Registered Family Dependents ({selectedUser.dependents.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.dependents.map((dep, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs py-1 px-2.5">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.role === 'HEALTHCARE_WORKER' && (
                <div className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Clinical Signing Privileges
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Facility: <strong className="text-foreground">{selectedUser.organization}</strong></div>
                    <div>License: <strong className="text-primary font-mono">{selectedUser.licenseNumber || 'Verified On File'}</strong></div>
                    <div>Administered: <strong className="text-foreground">{selectedUser.vaccinationsAdministered || '—'} doses</strong></div>
                    <div>Patients Managed: <strong className="text-foreground">{selectedUser.totalPatients || '—'}</strong></div>
                  </div>
                </div>
              )}

              {/* Suspension Reason Banner if suspended */}
              {selectedUser.account_status === 'SUSPENDED' && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Ban className="h-4 w-4" />
                    <span>Account Suspended Under Administrative Order</span>
                  </div>
                  <p>{selectedUser.suspendedReason || 'Administrative suspension pending investigation.'}</p>
                </div>
              )}

              {/* User Activity Log */}
              {selectedUser.activityLog && selectedUser.activityLog.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Recent Activity Logs
                  </span>
                  <div className="space-y-1.5">
                    {selectedUser.activityLog.map((log, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs flex items-center justify-between"
                      >
                        <span className="text-foreground/90 font-medium">{log.action}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenManage(selectedUser);
                  }}
                  className="text-xs gap-1.5"
                >
                  <UserCog className="h-3.5 w-3.5" />
                  <span>Modify Status or Role</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Status & Role Management Modal */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <form onSubmit={handleSaveManageStatus} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Manage Account Status & Role</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update role assignments or adjust active access status for {selectedUser.name}.
                </DialogDescription>
              </DialogHeader>

              {/* Role selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assigned System Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATIENT">Patient / Family</SelectItem>
                    <SelectItem value="HEALTHCARE_WORKER">Healthcare Worker</SelectItem>
                    <SelectItem value="ADMIN">System Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Changing roles adjusts workspace navigation and clinical signing capabilities.
                </p>
              </div>

              {/* Account Status selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Account State</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Full Access)</SelectItem>
                    <SelectItem value="PENDING">Pending Verification</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended (Access Revoked)</SelectItem>
                    <SelectItem value="INACTIVE">Inactive (Archived)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audit Reason memo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Administrative Reason / Audit Memo
                  {newStatus === 'SUSPENDED' && <span className="text-destructive"> *</span>}
                </Label>
                <Textarea
                  placeholder="State the administrative rationale for this status update..."
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="text-xs h-20"
                  required={newStatus === 'SUSPENDED'}
                />
                <p className="text-[10.5px] text-muted-foreground">
                  This note will be logged in the immutable security audit log.
                </p>
              </div>

              <DialogFooter className="pt-2 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setManageModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={`text-xs ${
                    newStatus === 'SUSPENDED' 
                      ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog for Suspensions */}
      <AlertDialog open={confirmSuspendOpen} onOpenChange={setConfirmSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" />
              <span>Suspend User Account?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Are you sure you want to suspend access for <strong>{selectedUser?.name}</strong>?
              The user will be immediately logged out of all active sessions and prevented from signing vaccination records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeStatusUpdate}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Suspension
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Role badge helper
 */
function RoleBadge({ role, label }) {
  if (role === 'ADMIN') {
    return (
      <Badge variant="outline" className="text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1 font-mono">
        <ShieldAlert className="h-3 w-3" />
        <span>{label || 'Administrator'}</span>
      </Badge>
    );
  }
  if (role === 'HEALTHCARE_WORKER') {
    return (
      <Badge variant="outline" className="text-[11px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1 font-mono">
        <Stethoscope className="h-3 w-3" />
        <span>{label || 'Healthcare Worker'}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] bg-secondary text-foreground border-border gap-1 font-mono">
      <User className="h-3 w-3" />
      <span>{label || 'Patient / Family'}</span>
    </Badge>
  );
}

/**
 * Inspection State Preview Toolbar
 */
function StatePreviewToolbar({ viewState, setViewState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>UI State Inspector:</span>
      </div>
      <div className="flex items-center gap-1">
        {['normal', 'loading', 'empty', 'error'].map((st) => (
          <button
            key={st}
            onClick={() => setViewState(st)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium text-xs transition-colors ${
              viewState === st 
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminUsersPage;
