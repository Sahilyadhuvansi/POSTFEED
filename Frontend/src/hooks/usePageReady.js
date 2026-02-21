import { useEffect } from "react";
import { usePageLoad } from "../context/PageLoadContext";

/**
 * Hook to signal when a page has finished loading and is ready to display
 * Call this once your page data is loaded and UI is rendered
 */
export function usePageReady(isReady) {
  const { signalPageReady } = usePageLoad();

  useEffect(() => {
    if (isReady) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        signalPageReady();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isReady, signalPageReady]);
}
