import { useState, useEffect, useCallback } from 'react';
import { familyApi, vaccinationApi, notificationApi } from './api.js';

const GLOBAL_STORAGE_KEYS = {
  CATALOG: 'vaxassist_cached_catalog',
  SYNC_LOCK: 'vaxassist_sync_lock',
};

/**
 * Get active user ID from stored session
 */
export function getActiveUserId() {
  try {
    const raw = localStorage.getItem('vaxassist_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id || user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Build scoped storage key for current user to maintain strict isolation
 */
function getUserKey(category, explicitUserId = null) {
  const uid = explicitUserId || getActiveUserId() || 'anonymous';
  return `vaxassist_${uid}_${category}`;
}

/**
 * Cache data safely in localStorage under user-scoped namespace
 */
export function cacheUserData(category, data, explicitUserId = null) {
  try {
    const key = getUserKey(category, explicitUserId);
    const envelope = {
      timestamp: Date.now(),
      cachedAt: new Date().toISOString(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[OfflineSync] Failed to cache user data for ${category}:`, err);
  }
}

/**
 * Read cached data from localStorage under user-scoped namespace
 */
export function getCachedUserData(category, explicitUserId = null) {
  try {
    const key = getUserKey(category, explicitUserId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw);
    return envelope?.data !== undefined ? envelope.data : envelope;
  } catch {
    return null;
  }
}

/**
 * Get cache metadata (timestamp and age)
 */
export function getCachedMetadata(category, explicitUserId = null) {
  try {
    const key = getUserKey(category, explicitUserId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw);
    return {
      cachedAt: envelope.cachedAt || null,
      timestamp: envelope.timestamp || 0,
      ageMs: envelope.timestamp ? Date.now() - envelope.timestamp : null,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve current offline queue for the active user
 */
export function getPendingQueue(explicitUserId = null) {
  try {
    const key = getUserKey('pending_queue', explicitUserId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear or update offline queue for the active user
 */
export function setPendingQueue(queue, explicitUserId = null) {
  try {
    const key = getUserKey('pending_queue', explicitUserId);
    localStorage.setItem(key, JSON.stringify(queue));
  } catch (err) {
    console.error('[OfflineSync] Failed to update sync queue:', err);
  }
}

/**
 * Generates human-friendly description for queued action
 */
function getActionDescription(action) {
  switch (action.type) {
    case 'ADD_MEMBER':
      return `Add family member: ${action.payload?.full_name || 'New Member'}`;
    case 'RECORD_VACCINATION':
      return `Record dose: ${action.payload?.vaccine_name || action.payload?.vaccine_code || 'Vaccine'} Dose ${action.payload?.dose_number || 1}`;
    case 'UPDATE_MEMBER':
      return `Update member profile`;
    case 'UPDATE_PREFERENCES':
      return `Update notification settings`;
    default:
      return 'Pending offline mutation';
  }
}

/**
 * Queue an offline mutation action (e.g. record vaccination or add member)
 * Immediately updates optimistic cache so user sees changes while offline
 */
export function queueOfflineAction(action, explicitUserId = null) {
  try {
    const uid = explicitUserId || getActiveUserId();
    if (!uid) {
      console.warn('[OfflineSync] Cannot queue action without active user session');
      return null;
    }

    const currentQueue = getPendingQueue(uid);
    const item = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: uid,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      attempts: 0,
      description: action.description || getActionDescription(action),
      ...action,
    };

    currentQueue.push(item);
    setPendingQueue(currentQueue, uid);

    // Apply Optimistic Update to Local Cache
    applyOptimisticUpdate(item, uid);

    return item;
  } catch (err) {
    console.error('[OfflineSync] Failed to queue offline action:', err);
    return null;
  }
}

/**
 * Optimistically apply queued mutation to user-scoped local caches
 */
function applyOptimisticUpdate(queueItem, userId) {
  try {
    if (queueItem.type === 'ADD_MEMBER') {
      const cachedMembers = getCachedUserData('members', userId) || [];
      const tempMember = {
        id: queueItem.tempId || `temp-${queueItem.id}`,
        full_name: queueItem.payload?.full_name || 'New Member',
        date_of_birth: queueItem.payload?.date_of_birth,
        relationship: queueItem.payload?.relationship || 'DEPENDENT',
        gender: queueItem.payload?.gender || 'OTHER',
        blood_group: queueItem.payload?.blood_group || 'UNKNOWN',
        allergies: queueItem.payload?.allergies || [],
        notes: queueItem.payload?.notes || '',
        isOfflinePending: true,
        created_at: new Date().toISOString(),
      };
      // Prevent duplicates in optimistic cache
      if (!cachedMembers.some((m) => m.full_name === tempMember.full_name && m.date_of_birth === tempMember.date_of_birth)) {
        cachedMembers.push(tempMember);
        cacheUserData('members', cachedMembers, userId);
      }
    } else if (queueItem.type === 'RECORD_VACCINATION') {
      const memberId = queueItem.memberId;
      if (memberId) {
        const recordsKey = `records_${memberId}`;
        const cachedRecords = getCachedUserData(recordsKey, userId) || [];
        const tempRecord = {
          id: `temp-rec-${queueItem.id}`,
          family_member_id: memberId,
          vaccine_code: queueItem.payload?.vaccine_code,
          vaccine_name: queueItem.payload?.vaccine_name || queueItem.payload?.vaccine_code,
          dose_number: queueItem.payload?.dose_number || 1,
          dose_name: queueItem.payload?.dose_name || `Dose ${queueItem.payload?.dose_number || 1}`,
          administered_date: queueItem.payload?.administered_date || new Date().toISOString().split('T')[0],
          healthcare_provider: queueItem.payload?.healthcare_provider || 'Pending Sync',
          batch_number: queueItem.payload?.batch_number || 'OFFLINE-LOG',
          vaccination_status: 'COMPLETED',
          is_verified: false,
          isOfflinePending: true,
          created_at: new Date().toISOString(),
        };
        cachedRecords.push(tempRecord);
        cacheUserData(recordsKey, cachedRecords, userId);
      }
    }
  } catch (e) {
    console.warn('[OfflineSync] Optimistic cache update error:', e);
  }
}

/**
 * Process pending offline actions when connection is restored
 * Uses mutex lock to prevent concurrent executions
 */
export async function syncPendingActions(explicitUserId = null) {
  const uid = explicitUserId || getActiveUserId();
  if (!uid) return { synced: 0, failed: 0, remaining: 0, errors: [] };

  // Check sync mutex lock
  const lock = localStorage.getItem(GLOBAL_STORAGE_KEYS.SYNC_LOCK);
  if (lock && Date.now() - parseInt(lock, 10) < 15000) {
    console.log('[OfflineSync] Synchronization already in progress by another task.');
    return { synced: 0, failed: 0, remaining: getPendingQueue(uid).length, errors: ['Sync locked'] };
  }

  // Acquire lock
  localStorage.setItem(GLOBAL_STORAGE_KEYS.SYNC_LOCK, Date.now().toString());

  const queue = getPendingQueue(uid);
  if (queue.length === 0) {
    localStorage.removeItem(GLOBAL_STORAGE_KEYS.SYNC_LOCK);
    return { synced: 0, failed: 0, remaining: 0, errors: [] };
  }

  const remaining = [];
  const errors = [];
  let synced = 0;
  let failed = 0;

  try {
    for (const item of queue) {
      // Validate item ownership
      if (item.userId && item.userId !== uid) {
        remaining.push(item);
        continue;
      }

      try {
        if (item.type === 'RECORD_VACCINATION') {
          const res = await vaccinationApi.addRecord(item.memberId, item.payload);
          synced++;
          // Update cached records with official server response
          if (res?.data && item.memberId) {
            const recordsKey = `records_${item.memberId}`;
            const cached = getCachedUserData(recordsKey, uid) || [];
            const updated = cached.filter((r) => !r.isOfflinePending || r.id !== `temp-rec-${item.id}`);
            updated.push(res.data);
            cacheUserData(recordsKey, updated, uid);
          }
        } else if (item.type === 'ADD_MEMBER') {
          const res = await familyApi.addMember(item.payload);
          synced++;
          // Update cached members with official server record
          if (res?.data) {
            const cached = getCachedUserData('members', uid) || [];
            const updated = cached.filter((m) => !m.isOfflinePending || m.id !== (item.tempId || `temp-${item.id}`));
            updated.push(res.data);
            cacheUserData('members', updated, uid);
          }
        } else if (item.type === 'UPDATE_PREFERENCES') {
          await notificationApi.updatePreferences(item.payload);
          synced++;
          cacheUserData('preferences', item.payload, uid);
        } else {
          // Unknown action type — retain without discarding
          remaining.push(item);
        }
      } catch (err) {
        const errorMsg = err.message || 'Network sync error';
        console.warn(`[OfflineSync] Sync failed for action ${item.id}:`, errorMsg);

        // Check if error is an idempotency "already exists" conflict:
        const isDuplicate = errorMsg.toLowerCase().includes('already exists') ||
                            errorMsg.toLowerCase().includes('already recorded');

        if (isDuplicate) {
          // Record was already saved on server — treat as resolved
          console.log(`[OfflineSync] Item ${item.id} already exists on server, resolving idempotently.`);
          synced++;
        } else {
          failed++;
          errors.push({ id: item.id, description: item.description, error: errorMsg });
          remaining.push({
            ...item,
            status: 'FAILED',
            attempts: (item.attempts || 0) + 1,
            lastAttempt: new Date().toISOString(),
            lastError: errorMsg,
          });
        }
      }
    }
  } finally {
    setPendingQueue(remaining, uid);
    localStorage.removeItem(GLOBAL_STORAGE_KEYS.SYNC_LOCK);
  }

  return { synced, failed, remaining: remaining.length, errors };
}

/**
 * Discard specific failed queue item by ID (User-controlled resolution)
 */
export function removeQueueItem(itemId, explicitUserId = null) {
  const uid = explicitUserId || getActiveUserId();
  if (!uid) return;
  const queue = getPendingQueue(uid);
  const updated = queue.filter((i) => i.id !== itemId);
  setPendingQueue(updated, uid);
}

/**
 * Check if the active user has pending uncommitted offline changes
 */
export function hasPendingChanges(explicitUserId = null) {
  const uid = explicitUserId || getActiveUserId();
  if (!uid) return false;
  return getPendingQueue(uid).length > 0;
}

/**
 * Safely handle logout: Isolate user cache and notify if unsynced items remain
 */
export function handleLogoutCleanup(userId) {
  if (!userId) return { hasUnsynced: false, count: 0 };
  const queue = getPendingQueue(userId);
  const count = queue.length;
  // Queue is preserved under userId namespace so user does not lose work when logging back in.
  // Sensitive tokens are cleared from active state.
  return {
    hasUnsynced: count > 0,
    count,
  };
}

/**
 * React hook for offline status and background synchronization
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(() => getPendingQueue().length);
  const [pendingItems, setPendingItems] = useState(() => getPendingQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const updateQueueState = useCallback(() => {
    const queue = getPendingQueue();
    setPendingCount(queue.length);
    setPendingItems(queue);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return null;
    setIsSyncing(true);
    try {
      const result = await syncPendingActions();
      setLastSyncResult(result);
      updateQueueState();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateQueueState]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateQueueState();
    if (navigator.onLine && getPendingQueue().length > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, updateQueueState]);

  return {
    isOnline,
    pendingCount,
    pendingItems,
    isSyncing,
    lastSyncResult,
    syncNow: triggerSync,
    queueAction: (action) => {
      const res = queueOfflineAction(action);
      updateQueueState();
      return res;
    },
    removeItem: (id) => {
      removeQueueItem(id);
      updateQueueState();
    },
    refreshQueueState: updateQueueState,
  };
}

export { GLOBAL_STORAGE_KEYS };
