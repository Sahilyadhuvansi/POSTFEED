import { useCallback } from "react";

/**
 * Global API Cache Singleton
 * Prevents refetching data across page navigations within a session
 */
const globalCacheStore = new Map();

/**
 * Hook to cache API responses with TTL (time-to-live)
 * This enhanced version uses a global singleton to persist data between re-mounts
 */
export function useApiCache(ttl = 5 * 60 * 1000) {
  // ttl = 5 minutes default
  
  const getFromCache = useCallback(
    (key) => {
      const cached = globalCacheStore.get(key);
      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > ttl) {
        globalCacheStore.delete(key);
        return null;
      }

      return cached.data;
    },
    [ttl],
  );

  const setCache = useCallback((key, data) => {
    globalCacheStore.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback((key) => {
    if (key) {
      globalCacheStore.delete(key);
    } else {
      globalCacheStore.clear();
    }
  }, []);

  return { getFromCache, setCache, clearCache };
}
