import { usePageReadiness } from "../context/PageReadinessContext";

/**
 * Wraps a page component to control its visibility based on readiness
 * Keeps old page visible while new page loads in background
 * Once new page is ready, instantly swaps visibility
 */
export const PageTransitionWrapper = ({ children, isCurrentPage }) => {
  const { pageReady } = usePageReadiness();

  // Only show if this is the current page AND it's ready
  // OR if this is the previous page and next page is NOT ready
  const shouldShow = isCurrentPage && pageReady;

  return (
    <div
      style={{
        display: shouldShow ? "block" : "none",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
};
