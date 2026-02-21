import { createContext, useContext, useState, useCallback } from "react";

const PageLoadContext = createContext();

export function PageLoadProvider({ children }) {
  const [isPageReady, setIsPageReady] = useState(true);
  const [nextPageReady, setNextPageReady] = useState(false);

  const signalPageReady = useCallback(() => {
    setNextPageReady(true);
  }, []);

  const resetPageState = useCallback(() => {
    setIsPageReady(false);
    setNextPageReady(false);
  }, []);

  const allowPageSwitch = useCallback(() => {
    setIsPageReady(true);
    setNextPageReady(false);
  }, []);

  return (
    <PageLoadContext.Provider
      value={{
        isPageReady,
        nextPageReady,
        signalPageReady,
        resetPageState,
        allowPageSwitch,
      }}
    >
      {children}
    </PageLoadContext.Provider>
  );
}

export function usePageLoad() {
  const context = useContext(PageLoadContext);
  if (!context) {
    throw new Error("usePageLoad must be used within PageLoadProvider");
  }
  return context;
}
