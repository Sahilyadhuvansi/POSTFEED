import { createContext, useContext, useState, useCallback } from "react";

const PageReadinessContext = createContext();

export const PageReadinessProvider = ({ children }) => {
  const [pageReady, setPageReady] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const markPageReady = useCallback((isReady = true) => {
    setPageReady(isReady);
  }, []);

  const markNavigating = useCallback(
    (newPath) => {
      if (newPath !== currentPath) {
        setPageReady(false);
        setCurrentPath(newPath);
      }
    },
    [currentPath],
  );

  return (
    <PageReadinessContext.Provider
      value={{ pageReady, markPageReady, markNavigating }}
    >
      {children}
    </PageReadinessContext.Provider>
  );
};

export const usePageReadiness = () => {
  const context = useContext(PageReadinessContext);
  if (!context) {
    throw new Error(
      "usePageReadiness must be used within PageReadinessProvider",
    );
  }
  return context;
};
