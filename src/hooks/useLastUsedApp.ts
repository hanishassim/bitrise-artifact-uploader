import { useState, useEffect, useCallback } from 'react';

const LAST_APP_KEY = 'bitrise-last-app';

export function useLastUsedApp() {
  const [lastUsedAppId, setLastUsedAppId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_APP_KEY);
    if (stored) {
      setLastUsedAppId(stored);
    }
  }, []);

  const saveLastUsedApp = useCallback((appId: string) => {
    setLastUsedAppId(appId);
    localStorage.setItem(LAST_APP_KEY, appId);
  }, []);

  const clearLastUsedApp = useCallback(() => {
    setLastUsedAppId(null);
    localStorage.removeItem(LAST_APP_KEY);
  }, []);

  return {
    lastUsedAppId,
    saveLastUsedApp,
    clearLastUsedApp,
  };
}
