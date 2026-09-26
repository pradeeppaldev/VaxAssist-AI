import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell, 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Activity,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  Check,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import ThemeToggle from '@/components/common/ThemeToggle';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useOfflineSync } from '@/services/offlineSync';
import { notificationApi } from '@/services/api';
import { ROLE_NAVIGATION } from './navigationConfig';

export function AppHeader({ onToggleMobileMenu }) {
  const { user, logout, getDashboardPath } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, loading: healthLoading } = useHealthCheck(45000);
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loadingNotifs, setLoadingNotifs] = React.useState(false);

  const role = user?.role || 'PATIENT';
  const roleConfig = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.PATIENT;

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const [notifsRes, countRes] = await Promise.allSettled([
        notificationApi.getNotifications({ limit: 5 }),
        notificationApi.getUnreadCount(),
      ]);
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.data) {
        setNotifications(notifsRes.value.data);
      }
      if (countRes.status === 'fulfilled' && countRes.value?.data) {
        setUnreadCount(countRes.value.data.unread_count || 0);
      }
    } catch {
      // Fallback gracefully
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notifId) => {
    try {
      await notificationApi.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    if (pendingCount > 0) {
      const confirmLogout = window.confirm(
        `Notice: You have ${pendingCount} offline change(s) pending synchronization.\n\n` +
        `They will remain saved securely on this device under your account, but cannot be synchronized until you sign back in.\n\n` +
        `Do you still wish to log out?`
      );
      if (!confirmLogout) return;
    }
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'VA';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Left Side: Mobile toggle + Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileMenu}
            className="md:hidden text-foreground"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link to={getDashboardPath()} className="flex items-center">
            <BrandLogo size="sm" subtitle={roleConfig.roleName} />
          </Link>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-xs text-muted-foreground font-medium">
            <span className="relative flex h-2 w-2">
              {!isOnline ? (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              ) : healthLoading ? (
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              ) : isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              )}
            </span>
            <span className="text-[11px] font-mono">
              {!isOnline
                ? 'Offline (Cached Clinical Core)'
                : healthLoading
                ? 'Checking node...'
                : isConnected
                ? 'Clinical API Active'
                : 'API Standby'}
            </span>
          </div>
        </div>

        {/* Right Side: Notifications, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline / Sync Status Indicator */}
          {!isOnline && (
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[11px] border-amber-500/50 text-amber-600 bg-amber-500/10 px-2 py-0.5 font-medium">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncNow}
              disabled={isSyncing}
              className="h-7 text-xs px-2 gap-1 border-primary/40 bg-primary/5 text-primary"
              title="Click to synchronize offline changes with server"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync ({pendingCount})</span>
            </Button>
          )}

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-foreground hover:bg-muted"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground font-sans">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  <span>Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {unreadCount} Unread
                  </Badge>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-primary hover:underline font-medium"
                      title="Mark all as read"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-border text-xs max-h-72 overflow-y-auto">
                {loadingNotifs && notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    Checking notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    All caught up! No new alerts.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isAlert = ['OVERDUE_ALERT', 'MISSED_ALERT', 'CLINICAL_REVIEW_ALERT'].includes(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                        className={`p-3 transition cursor-pointer hover:bg-muted/50 ${
                          !n.is_read ? 'bg-primary/5 font-medium' : 'opacity-85'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {isAlert ? (
                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`truncate text-foreground text-xs ${!n.is_read ? 'font-semibold' : ''}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2 leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                              {n.created_at ? new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border p-2 bg-muted/20 text-center">
                <Link
                  to={role === 'PATIENT' ? '/reminders' : role === 'ADMIN' ? '/admin/notifications' : '/healthcare/notifications'}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  View all alerts &amp; reminders
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted transition outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8 border border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                    {user?.name || 'Healthcare User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none font-medium capitalize">
                    {role.replace('_', ' ').toLowerCase()}
                  </span>
                </div>

                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground opacity-70" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 shadow-lg">
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold text-foreground truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <div className="pt-1">
                    <Badge variant={roleConfig.badgeVariant} className="text-[10px]">
                      {roleConfig.badgeText}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate(role === 'PATIENT' ? '/profile' : '/settings')}>
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate(role === 'PATIENT' ? '/settings' : role === 'ADMIN' ? '/admin/settings' : '/healthcare/settings')}>
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Account Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
