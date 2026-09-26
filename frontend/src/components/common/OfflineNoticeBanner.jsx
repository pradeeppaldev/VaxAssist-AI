import React, { useState } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { useOfflineSync } from '@/services/offlineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function OfflineNoticeBanner() {
  const {
    isOnline,
    pendingCount,
    pendingItems,
    isSyncing,
    lastSyncResult,
    syncNow,
    removeItem,
  } = useOfflineSync();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If online with 0 pending items, banner is not needed
  if (isOnline && pendingCount === 0 && !lastSyncResult?.failed) {
    return null;
  }

  const hasFailedItems = pendingItems.some((item) => item.status === 'FAILED');

  return (
    <>
      <aside 
        aria-label="Offline and Synchronization Alert"
        className={`w-full border-b transition-colors px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-30 ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          : hasFailedItems
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
          : 'bg-primary/10 border-primary/30 text-primary dark:text-emerald-300'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {!isOnline ? (
            <>
              <Badge variant="outline" className="border-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-300 gap-1 px-1.5 py-0">
                <WifiOff className="h-3 w-3" />
                <span>Offline Mode</span>
              </Badge>
              <span className="font-medium">
                Viewing cached clinical records. New entries are securely saved on this device and will sync automatically when reconnected.
              </span>
            </>
          ) : hasFailedItems ? (
            <>
              <Badge variant="outline" className="border-rose-500/50 bg-rose-500/20 text-rose-700 dark:text-rose-300 gap-1 px-1.5 py-0">
                <AlertTriangle className="h-3 w-3" />
                <span>Sync Attention Needed</span>
              </Badge>
              <span className="font-medium">
                One or more offline changes could not be synchronized with the server.
              </span>
            </>
          ) : (
            <>
              <Badge variant="outline" className="border-primary/50 bg-primary/20 text-primary gap-1 px-1.5 py-0">
                <CheckCircle2 className="h-3 w-3" />
                <span>Connected</span>
              </Badge>
              <span className="font-medium">
                Connection restored. {pendingCount > 0 ? `${pendingCount} offline change(s) ready to sync.` : 'All offline changes synchronized.'}
              </span>
            </>
          )}

          {pendingCount > 0 && (
            <span className="text-[11px] opacity-80 font-mono">
              ({pendingCount} pending {pendingCount === 1 ? 'action' : 'actions'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDetailsOpen(true)}
              className="h-6 text-[11px] px-2 py-0 border-current hover:bg-current/10"
            >
              View Queue ({pendingCount})
            </Button>
          )}

          {isOnline && pendingCount > 0 && (
            <Button
              size="sm"
              variant="default"
              onClick={syncNow}
              disabled={isSyncing}
              className="h-6 text-[11px] px-2.5 py-0 gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Sync Queue Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
              <span>Offline Synchronization Queue</span>
            </DialogTitle>
            <DialogDescription>
              Actions recorded while offline. They are preserved securely in local device storage and sent to the server in chronological order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 py-2">
            {pendingItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p>No pending offline operations.</p>
                <p className="text-xs">Your local view is up to date with the server.</p>
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    item.status === 'FAILED'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{item.description || item.type}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        item.status === 'FAILED'
                          ? 'border-rose-500 text-rose-600 bg-rose-500/10'
                          : 'border-amber-500 text-amber-600 bg-amber-500/10'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Queued: {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {item.attempts > 0 && <span>Attempts: {item.attempts}</span>}
                  </div>

                  {item.lastError && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 p-1.5 rounded font-mono break-all">
                      Error: {item.lastError}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="h-6 text-[11px] text-destructive hover:text-destructive px-2 py-0 gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Discard</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {isOnline ? 'Online — Ready to synchronize' : 'Offline — Awaiting connectivity'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
              {isOnline && pendingItems.length > 0 && (
                <Button size="sm" onClick={syncNow} disabled={isSyncing} className="gap-1">
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OfflineNoticeBanner;
