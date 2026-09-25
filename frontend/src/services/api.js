const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Fetch system health from backend
 */
export async function fetchHealthCheck() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!response.ok) {
      throw new Error(`Server responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      latency,
      status: response.status,
      data,
    };
  } catch (error) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    return {
      success: false,
      latency,
      error: error.message || 'Failed to connect to backend server',
      data: null,
    };
  }
}

export { API_BASE_URL };
