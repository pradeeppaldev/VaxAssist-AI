import {
  cacheUserData,
  getCachedUserData,
  queueOfflineAction,
  GLOBAL_STORAGE_KEYS,
} from './offlineSync.js';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

/**
 * Maps API routes to user-scoped local cache categories
 */
function getCacheCategoryForEndpoint(endpoint) {
  // Strip query parameters
  const path = endpoint.split('?')[0];

  if (path === '/families/me/members') return 'members';
  if (path === '/families/me') return 'family';
  if (path === '/notifications/preferences') return 'preferences';
  if (path === '/notifications') return 'notifications';
  if (path === '/vaccinations/catalog') return 'catalog';
  if (path.startsWith('/vaccinations/member/') && path.endsWith('/schedule')) {
    const parts = path.split('/');
    const memberId = parts[3];
    return `schedule_${memberId}`;
  }
  if (path.startsWith('/vaccinations/member/')) {
    const parts = path.split('/');
    const memberId = parts[3];
    return `records_${memberId}`;
  }
  return null;
}

/**
 * Universal fetch wrapper supporting auth tokens, structured error handling,
 * user-isolated offline caching, and transparent offline mutation queueing.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('vaxassist_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const method = (options.method || 'GET').toUpperCase();
  const cacheCategory = getCacheCategoryForEndpoint(endpoint);
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // -------------------------------------------------------------
  // 1. Proactive Offline Handling (when browser navigator is offline)
  // -------------------------------------------------------------
  if (isOffline) {
    if (method === 'GET') {
      if (cacheCategory) {
        const cached = cacheCategory === 'catalog'
          ? JSON.parse(localStorage.getItem(GLOBAL_STORAGE_KEYS.CATALOG) || 'null')
          : getCachedUserData(cacheCategory);

        if (cached) {
          return {
            success: true,
            message: 'Loaded from offline cache',
            data: cached,
            _isOfflineCached: true,
          };
        }
      }
      const offlineErr = new Error('You are currently offline and this data has not been cached yet.');
      offlineErr.isOffline = true;
      throw offlineErr;
    }

    // Supported offline mutations
    let payload = null;
    try {
      payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      payload = {};
    }

    if (endpoint === '/families/me/members' && method === 'POST') {
      const tempId = `offline-mem-${Date.now()}`;
      queueOfflineAction({
        type: 'ADD_MEMBER',
        payload,
        tempId,
        description: `Add family member: ${payload?.full_name || 'New Member'}`,
      });
      return {
        success: true,
        message: 'Family member queued offline. Will synchronize when online.',
        data: {
          id: tempId,
          ...payload,
          isOfflinePending: true,
          created_at: new Date().toISOString(),
        },
        _isOfflineQueued: true,
      };
    }

    if (endpoint.startsWith('/vaccinations/member/') && method === 'POST') {
      const parts = endpoint.split('/');
      const memberId = parts[3];
      const tempId = `offline-rec-${Date.now()}`;
      queueOfflineAction({
        type: 'RECORD_VACCINATION',
        memberId,
        payload,
        tempId,
        description: `Record dose: ${payload?.vaccine_code || 'Vaccine'} Dose ${payload?.dose_number || 1}`,
      });
      return {
        success: true,
        message: 'Vaccination record queued offline. Will synchronize when online.',
        data: {
          id: tempId,
          family_member_id: memberId,
          ...payload,
          isOfflinePending: true,
          created_at: new Date().toISOString(),
        },
        _isOfflineQueued: true,
      };
    }

    if (endpoint === '/notifications/preferences' && (method === 'PUT' || method === 'PATCH')) {
      queueOfflineAction({
        type: 'UPDATE_PREFERENCES',
        payload,
        description: 'Update notification preferences',
      });
      return {
        success: true,
        message: 'Notification preferences queued offline.',
        data: payload,
        _isOfflineQueued: true,
      };
    }

    // Actions that strictly require active connectivity (AI RAG, PDF export, login)
    const unsupportedErr = new Error('This action requires an active internet connection.');
    unsupportedErr.isOffline = true;
    throw unsupportedErr;
  }

  // -------------------------------------------------------------
  // 2. Online Fetch Execution with Automatic Fallback & Caching
  // -------------------------------------------------------------
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Connection dropped during fetch
    if (method === 'GET' && cacheCategory) {
      const cached = cacheCategory === 'catalog'
        ? JSON.parse(localStorage.getItem(GLOBAL_STORAGE_KEYS.CATALOG) || 'null')
        : getCachedUserData(cacheCategory);

      if (cached) {
        console.warn(`[API] Network failure on ${endpoint}. Serving from offline cache.`);
        return {
          success: true,
          message: 'Loaded from offline cache (Network unavailable)',
          data: cached,
          _isOfflineCached: true,
        };
      }
    }
    networkError.isOffline = true;
    throw networkError;
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((d) => d.msg || d.message).join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  // Update user-scoped cache on successful GET
  if (method === 'GET' && cacheCategory && data?.data) {
    if (cacheCategory === 'catalog') {
      try {
        localStorage.setItem(GLOBAL_STORAGE_KEYS.CATALOG, JSON.stringify(data.data));
      } catch {}
    } else {
      cacheUserData(cacheCategory, data.data);
    }
  }

  return data;
}

/**
 * Health check
 */
export async function fetchHealthCheck() {
  const startTime = performance.now();
  try {
    const data = await request('/health', { method: 'GET' });
    const endTime = performance.now();
    return {
      success: true,
      latency: Math.round(endTime - startTime),
      data,
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      latency: Math.round(endTime - startTime),
      error: error.message || 'Failed to connect to backend',
      data: null,
    };
  }
}

/**
 * Authentication API
 */
export const authApi = {
  login: async (email, password) => {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (payload) => {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMe: async () => {
    return await request('/auth/me', {
      method: 'GET',
    });
  },
};

/**
 * Admin User Management API
 */
export const adminApi = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/admin/users${queryString}`, {
      method: 'GET',
    });
  },

  updateUserStatus: async (userId, accountStatus, reason = null) => {
    return await request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        account_status: accountStatus,
        reason,
      }),
    });
  },

  updateUserRole: async (userId, role) => {
    return await request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

/**
 * Family & Patient Management API (Phase 3)
 */
export const familyApi = {
  getMyFamily: async () => {
    return await request('/families/me', {
      method: 'GET',
    });
  },

  createFamily: async (payload) => {
    return await request('/families', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMyFamily: async (payload) => {
    return await request('/families/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getMembers: async () => {
    return await request('/families/me/members', {
      method: 'GET',
    });
  },

  addMember: async (payload) => {
    return await request('/families/me/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMember: async (memberId) => {
    return await request(`/families/me/members/${memberId}`, {
      method: 'GET',
    });
  },

  updateMember: async (memberId, payload) => {
    return await request(`/families/me/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteMember: async (memberId) => {
    return await request(`/families/me/members/${memberId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Vaccination Management & Schedule API (Phase 4)
 */
export const vaccinationApi = {
  getCatalog: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/vaccinations/catalog${queryString}`, {
      method: 'GET',
    });
  },

  getMemberRecords: async (memberId) => {
    return await request(`/vaccinations/member/${memberId}`, {
      method: 'GET',
    });
  },

  getMemberSchedule: async (memberId, params = {}) => {
    const query = new URLSearchParams();
    if (params.reference_date) query.append('reference_date', params.reference_date);
    if (params.eligible_for_je) query.append('eligible_for_je', 'true');
    if (params.include_private) query.append('include_private', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/vaccinations/member/${memberId}/schedule${queryString}`, {
      method: 'GET',
    });
  },

  addRecord: async (memberId, payload) => {
    return await request(`/vaccinations/member/${memberId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getRecord: async (recordId) => {
    return await request(`/vaccinations/records/${recordId}`, {
      method: 'GET',
    });
  },

  updateRecord: async (recordId, payload) => {
    return await request(`/vaccinations/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteRecord: async (recordId) => {
    return await request(`/vaccinations/records/${recordId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Proactive Monitoring & Notification API (Phase 6)
 */
export const notificationApi = {
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.type) query.append('type', params.type);
    if (params.priority) query.append('priority', params.priority);
    if (params.is_read !== undefined && params.is_read !== null) {
      query.append('is_read', params.is_read.toString());
    }
    if (params.limit) query.append('limit', params.limit);
    if (params.skip) query.append('skip', params.skip);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/notifications${queryString}`, {
      method: 'GET',
    });
  },

  getUnreadCount: async () => {
    return await request('/notifications/unread-count', {
      method: 'GET',
    });
  },

  markAsRead: async (notificationId) => {
    return await request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  acknowledge: async (notificationId) => {
    return await request(`/notifications/${notificationId}/acknowledge`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return await request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  },

  getHistory: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.limit) query.append('limit', params.limit);
    if (params.skip) query.append('skip', params.skip);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/notifications/history${queryString}`, {
      method: 'GET',
    });
  },

  getPreferences: async () => {
    return await request('/notifications/preferences', {
      method: 'GET',
    });
  },

  updatePreferences: async (payload) => {
    return await request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  triggerMonitoring: async (payload = {}) => {
    return await request('/notifications/monitor/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Knowledge Base & Grounded RAG API (Phase 7)
 */
export const knowledgeApi = {
  uploadDocument: async (formData) => {
    return await request('/knowledge/documents', {
      method: 'POST',
      body: formData,
    });
  },

  listDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.document_type && params.document_type !== 'ALL') query.append('document_type', params.document_type);
    if (params.source_authority && params.source_authority !== 'ALL') query.append('source_authority', params.source_authority);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.skip) query.append('skip', params.skip);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/knowledge/documents${queryString}`, {
      method: 'GET',
    });
  },

  getMetrics: async () => {
    return await request('/knowledge/documents/metrics', {
      method: 'GET',
    });
  },

  getDocument: async (documentId) => {
    return await request(`/knowledge/documents/${documentId}`, {
      method: 'GET',
    });
  },

  updateDocument: async (documentId, payload) => {
    return await request(`/knowledge/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteDocument: async (documentId) => {
    return await request(`/knowledge/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  reindexDocument: async (documentId) => {
    return await request(`/knowledge/documents/${documentId}/reindex`, {
      method: 'POST',
    });
  },

  getDocumentStatus: async (documentId) => {
    return await request(`/knowledge/documents/${documentId}/status`, {
      method: 'GET',
    });
  },

  queryKnowledgeBase: async (payload) => {
    return await request('/knowledge/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Helper to download binary files (e.g. PDF) from backend endpoints
 */
export async function downloadFile(endpoint, payload, defaultFilename = 'vaxassist_report.pdf') {
  const token = localStorage.getItem('vaxassist_token');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText = `HTTP error ${response.status}`;
    try {
      const errJson = await response.json();
      errorText = errJson.detail || errJson.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(errorText);
  }

  // Extract filename from Content-Disposition header if available
  let filename = defaultFilename;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = disposition.match(/filename=["']?([^"';]+)["']?/i);
    if (matches && matches[1]) {
      filename = matches[1].trim();
    }
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 300);

  return { success: true, filename };
}

/**
 * Helper to download structured JSON data directly in browser
 */
export function downloadJsonFile(jsonData, filename = 'vaxassist_report.json') {
  const blob = new Blob([typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2)], {
    type: 'application/json',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 300);
  return { success: true, filename };
}

/**
 * Multi-Agent System & Orchestrator API (Phase 8 & 9)
 */
export const agentApi = {
  getArchitecture: async () => {
    return await request('/agents/architecture', { method: 'GET' });
  },

  getWorkflows: async () => {
    return await request('/agents/orchestrator/workflows', { method: 'GET' });
  },

  runOrchestrator: async (payload) => {
    return await request('/agents/orchestrator/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  runOrchestratorLifecycle: async (payload) => {
    return await request('/agents/orchestrator/run-lifecycle', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  routeTask: async (payload) => {
    return await request('/agents/orchestrator/route', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  evaluateMonitoring: async (payload = {}) => {
    return await request('/agents/monitoring/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  dispatchReminders: async (payload = {}) => {
    return await request('/agents/reminders/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  askKnowledge: async (payload) => {
    return await request('/agents/knowledge/ask', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateRecommendations: async (payload = {}) => {
    return await request('/agents/recommendations/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateReport: async (payload) => {
    return await request('/agents/reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  downloadReportPdf: async (payload, defaultFilename = 'vaxassist_passport.pdf') => {
    return await downloadFile('/agents/reports/download', payload, defaultFilename);
  },
};

export { API_BASE_URL };


