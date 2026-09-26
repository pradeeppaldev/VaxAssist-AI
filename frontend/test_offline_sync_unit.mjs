/**
 * Unit Test Suite for VaxAssist AI Offline Sync & User Isolation (Phase B)
 * Evaluates storage namespacing, offline queueing, optimistic updates, and conflict resolution.
 */

// Mock browser localStorage for Node environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage();

try {
  Object.defineProperty(globalThis.navigator, 'onLine', { value: false, configurable: true, writable: true });
} catch {
  // already defined or fallback
}

// Import offlineSync functions
import {
  cacheUserData,
  getCachedUserData,
  getCachedMetadata,
  queueOfflineAction,
  getPendingQueue,
  setPendingQueue,
  removeQueueItem,
  hasPendingChanges,
  handleLogoutCleanup,
} from './src/services/offlineSync.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  VaxAssist AI — Phase B Offline Sync & Caching Unit Tests');
  console.log('===============================================================\n');

  // Test 1: User-Isolated Cache Namespacing
  console.log('[TEST 1] Testing User-Isolated Local Cache Namespacing...');
  localStorage.clear();

  const userA = 'user_sharma_001';
  const userB = 'user_verma_002';

  const sharmaMembers = [
    { id: 'mem-1', full_name: 'Aarav Sharma', date_of_birth: '2021-03-15' },
    { id: 'mem-2', full_name: 'Ananya Sharma', date_of_birth: '2024-08-20' },
  ];

  const vermaMembers = [
    { id: 'mem-9', full_name: 'Karan Verma', date_of_birth: '2023-01-10' },
  ];

  cacheUserData('members', sharmaMembers, userA);
  cacheUserData('members', vermaMembers, userB);

  const readSharma = getCachedUserData('members', userA);
  const readVerma = getCachedUserData('members', userB);

  assert(readSharma.length === 2, 'User A (Sharma) retrieved exactly 2 members');
  assert(readSharma[0].full_name === 'Aarav Sharma', 'Sharma data intact');
  assert(readVerma.length === 1, 'User B (Verma) retrieved exactly 1 member');
  assert(readVerma[0].full_name === 'Karan Verma', 'Verma data isolated from Sharma');

  // Test 2: Cache Metadata and Expiry tracking
  console.log('\n[TEST 2] Testing Cache Metadata & Timestamps...');
  const meta = getCachedMetadata('members', userA);
  assert(meta.timestamp > 0, 'Cache contains valid epoch timestamp');
  assert(typeof meta.cachedAt === 'string', 'Cache contains ISO string timestamp');
  assert(meta.ageMs >= 0, 'Cache age is non-negative');

  // Test 3: Offline Action Queueing & Idempotency Key
  console.log('\n[TEST 3] Testing Offline Action Queueing & Idempotency Keys...');
  const newMemberAction = {
    type: 'ADD_MEMBER',
    payload: {
      full_name: 'Rohan Sharma',
      date_of_birth: '2026-01-10',
      relationship: 'CHILD',
    },
    description: 'Add family member: Rohan Sharma',
  };

  const queuedItem = queueOfflineAction(newMemberAction, userA);
  assert(queuedItem !== null, 'Action successfully queued');
  assert(queuedItem.status === 'PENDING', 'Action starts in PENDING status');
  assert(queuedItem.idempotencyKey.startsWith('idemp-'), 'Idempotency key generated');
  assert(queuedItem.userId === userA, 'Action strictly associated with User A');
  assert(queuedItem.attempts === 0, 'Initial attempt counter is 0');

  // Test 4: Queue Persistence across Refresh Simulation
  console.log('\n[TEST 4] Testing Queue Persistence Across Simulated Browser Refreshes...');
  const queueAfterRefresh = getPendingQueue(userA);
  assert(queueAfterRefresh.length === 1, 'Queue retained in localStorage');
  assert(queueAfterRefresh[0].payload.full_name === 'Rohan Sharma', 'Action payload fully preserved');

  // Test 5: Optimistic Local Cache Update
  console.log('\n[TEST 5] Testing Optimistic Local Cache Update...');
  const updatedSharmaMembers = getCachedUserData('members', userA);
  assert(updatedSharmaMembers.length === 3, 'Optimistic cache added Rohan Sharma while offline');
  const rohan = updatedSharmaMembers.find((m) => m.full_name === 'Rohan Sharma');
  assert(rohan && rohan.isOfflinePending === true, 'Rohan Sharma flagged with isOfflinePending: true');

  // Test 6: Cross-Account Queue Segregation
  console.log('\n[TEST 6] Testing Cross-Account Queue Segregation...');
  const vermaQueue = getPendingQueue(userB);
  assert(vermaQueue.length === 0, 'User B has 0 pending items (cannot access User A queue)');

  // Test 7: Conflict & Error Capture (Non-Silent Failure)
  console.log('\n[TEST 7] Testing Non-Silent Failure Capture in Queue...');
  const currentQueue = getPendingQueue(userA);
  currentQueue[0].status = 'FAILED';
  currentQueue[0].attempts = 1;
  currentQueue[0].lastError = 'Validation failed: Birth date cannot be future date';
  setPendingQueue(currentQueue, userA);

  const failedQueue = getPendingQueue(userA);
  assert(failedQueue[0].status === 'FAILED', 'Failed status preserved');
  assert(failedQueue[0].attempts === 1, 'Attempt counter incremented');
  assert(failedQueue[0].lastError.includes('Validation failed'), 'Error reason captured for user inspection');

  // Test 8: Manual Discard / Item Removal
  console.log('\n[TEST 8] Testing Manual Discard of Failed Queue Item...');
  removeQueueItem(failedQueue[0].id, userA);
  const clearedQueue = getPendingQueue(userA);
  assert(clearedQueue.length === 0, 'Item successfully removed from queue');

  // Test 9: Logout Protection
  console.log('\n[TEST 9] Testing Safe Logout Handling...');
  // Queue a new action before logout
  queueOfflineAction({
    type: 'RECORD_VACCINATION',
    memberId: 'mem-1',
    payload: { vaccine_code: 'DPT_BOOSTER', dose_number: 2 },
    description: 'Record dose: DPT Booster 2',
  }, userA);

  const logoutStatus = handleLogoutCleanup(userA);
  assert(logoutStatus.hasUnsynced === true, 'Logout detects unsynced changes');
  assert(logoutStatus.count === 1, 'Logout reports exact unsynced count (1)');

  const preservedQueue = getPendingQueue(userA);
  assert(preservedQueue.length === 1, 'User A queue preserved under user namespace on logout');

  console.log('\n===============================================================');
  console.log(`  ALL FRONTEND OFFLINE SYNC UNIT TESTS PASSED: ${passed} / ${passed + failed}`);
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
