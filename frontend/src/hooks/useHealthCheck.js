import { useState, useEffect, useCallback } from 'react';
import { fetchHealthCheck } from '../services/api';

export function useHealthCheck(autoRefreshInterval = null) {
  const [data, setData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    const result = await fetchHealthCheck();
    setLatency(result.latency);
    setLastChecked(new Date());

    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setData(null);
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();

    if (autoRefreshInterval && autoRefreshInterval > 0) {
      const interval = setInterval(checkHealth, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, autoRefreshInterval]);

  return {
    data,
    latency,
    loading,
    error,
    lastChecked,
    refresh: checkHealth,
    isConnected: !loading && !error && data !== null,
  };
}
