import { useCallback } from "react";

const globalCache = new Map();

/**
 * Hook to cache API responses with TTL (time-to-live)
 * Prevents refetching same data within a time window
 */
export function useApiCache(ttl = 5 * 60 * 1000) {
  // ttl = 5 minutes default

  const getFromCache = useCallback(
    (key) => {
      const cached = globalCache.get(key);
      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > ttl) {
        globalCache.delete(key);
        return null;
      }

      return cached.data;
    },
    [ttl],
  );

  const setCache = useCallback((key, data) => {
    globalCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback((key) => {
    if (key) {
      globalCache.delete(key);
    } else {
      globalCache.clear();
    }
  }, []);

  return { getFromCache, setCache, clearCache };
}
