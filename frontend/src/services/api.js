const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Universal fetch wrapper supporting auth tokens and structured error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('vaxassist_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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

export { API_BASE_URL };
