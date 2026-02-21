import { useEffect } from "react";
import { usePageReadiness } from "../context/PageReadinessContext";

/**
 * Hook for pages to signal when they're fully loaded and ready to display
 * Call this after all your data is fetched and UI is rendered
 * @param {boolean} isReady - true when page data is loaded, false while loading
 */
export const usePageReady = (isReady = true) => {
  const { markPageReady } = usePageReadiness();

  useEffect(() => {
    markPageReady(isReady);
  }, [isReady, markPageReady]);
};
