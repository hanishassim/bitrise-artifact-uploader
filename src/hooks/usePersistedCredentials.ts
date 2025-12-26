import { useState, useEffect, useCallback } from 'react';

const CREDENTIALS_KEY = 'bitrise-credentials';

interface StoredCredentials {
  apiToken: string;
  appId: string;
}

export function usePersistedCredentials() {
  const [apiToken, setApiToken] = useState('');
  const [appId, setAppId] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (stored) {
      try {
        const { apiToken: storedToken, appId: storedAppId } = JSON.parse(stored) as StoredCredentials;
        setApiToken(storedToken || '');
        setAppId(storedAppId || '');
      } catch {
        // Invalid stored data, ignore
      }
    }
    setIsLoaded(true);
  }, []);

  const updateApiToken = useCallback((value: string) => {
    setApiToken(value);
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ ...current, apiToken: value }));
  }, []);

  const updateAppId = useCallback((value: string) => {
    setAppId(value);
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ ...current, appId: value }));
  }, []);

  const clearCredentials = useCallback(() => {
    setApiToken('');
    setAppId('');
    localStorage.removeItem(CREDENTIALS_KEY);
  }, []);

  return {
    apiToken,
    appId,
    isLoaded,
    setApiToken: updateApiToken,
    setAppId: updateAppId,
    clearCredentials,
  };
}
