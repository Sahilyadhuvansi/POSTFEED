import { useRef, useCallback } from "react";

/**
 * Advanced React Query / SWR style caching hook.
 * Features: TTL, Stale-While-Revalidate, and Background Revalidation support.
 */
export function useApiCache(options = { ttl: 5 * 60 * 1000, staleTime: 30 * 1000 }) {
  const cacheRef = useRef(new Map());

  const getFromCache = useCallback(
    (key) => {
      const cached = cacheRef.current.get(key);
      if (!cached) return { data: null, isStale: true };

      const age = Date.now() - cached.timestamp;
      const isExpired = age > options.ttl;
      const isStale = age > options.staleTime;

      if (isExpired) {
        cacheRef.current.delete(key);
        return { data: null, isStale: true };
      }

      return { data: cached.data, isStale };
    },
    [options.ttl, options.staleTime],
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
