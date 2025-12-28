import { useState, useEffect, useCallback } from 'react';

const CREDENTIALS_KEY = 'bitrise-credentials';

interface StoredCredentials {
  apiToken: string;
  appId: string;
  workspaceId: string;
  organizationName: string;
}

export function usePersistedCredentials() {
  const [apiToken, setApiToken] = useState('');
  const [appId, setAppId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (stored) {
      try {
        const {
          apiToken: storedToken,
          appId: storedAppId,
          workspaceId: storedWorkspaceId,
          organizationName: storedOrganizationName,
        } = JSON.parse(stored) as StoredCredentials;
        setApiToken(storedToken || '');
        setAppId(storedAppId || '');
        setWorkspaceId(storedWorkspaceId || '');
        setOrganizationName(storedOrganizationName || '');
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

  const updateWorkspaceId = useCallback((value: string) => {
    setWorkspaceId(value);
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ ...current, workspaceId: value }));
  }, []);

  const updateOrganizationName = useCallback((value: string) => {
    setOrganizationName(value);
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ ...current, organizationName: value }));
  }, []);

  const clearCredentials = useCallback(() => {
    setApiToken('');
    setAppId('');
    setWorkspaceId('');
    setOrganizationName('');
    localStorage.removeItem(CREDENTIALS_KEY);
  }, []);

  return {
    apiToken,
    appId,
    workspaceId,
    organizationName,
    isLoaded,
    setApiToken: updateApiToken,
    setAppId: updateAppId,
    setWorkspaceId: updateWorkspaceId,
    setOrganizationName: updateOrganizationName,
    clearCredentials,
  };
}
