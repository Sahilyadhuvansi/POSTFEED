import { useRef, useCallback } from "react";

/**
 * Hook to cache API responses with TTL (time-to-live)
 * Prevents refetching same data within a time window
 */
export function useApiCache(ttl = 5 * 60 * 1000) {
  // ttl = 5 minutes default
  const cacheRef = useRef(new Map());

  const getFromCache = useCallback(
    (key) => {
      const cached = cacheRef.current.get(key);
      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > ttl) {
        cacheRef.current.delete(key);
        return null;
      }

      return cached.data;
    },
    [ttl],
  );

  const setCache = useCallback((key, data) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback((key) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return { getFromCache, setCache, clearCache };
}
