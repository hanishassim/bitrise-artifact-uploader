import { useState, useEffect, useCallback, useMemo } from 'react';
import { ObfuscatedCredentialStorage } from '@/lib/ObfuscatedCredentialStorage';

const CREDENTIALS_KEY = 'bitrise-credentials';

interface StoredCredentials {
  apiToken: string;
  appId: string;
  workspaceId: string;
}

export function usePersistedCredentials() {
  const credentialStorage = useMemo(() => new ObfuscatedCredentialStorage<StoredCredentials>(CREDENTIALS_KEY), []);

  const [apiToken, setApiToken] = useState('');
  const [appId, setAppId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = credentialStorage.get();
    if (stored) {
      setApiToken(stored.apiToken || '');
      setAppId(stored.appId || '');
      setWorkspaceId(stored.workspaceId || '');
    }
    setIsLoaded(true);
  }, [credentialStorage]);

  const updateCredentials = useCallback((newValues: Partial<StoredCredentials>) => {
    const current = credentialStorage.get() || { apiToken: '', appId: '', workspaceId: '' };
    const updated = { ...current, ...newValues };
    credentialStorage.set(updated);
  }, [credentialStorage]);

  const updateApiToken = useCallback((value: string) => {
    setApiToken(value);
    updateCredentials({ apiToken: value });
  }, [updateCredentials]);

  const updateAppId = useCallback((value: string) => {
    setAppId(value);
    updateCredentials({ appId: value });
  }, [updateCredentials]);

  const updateWorkspaceId = useCallback((value: string) => {
    setWorkspaceId(value);
    updateCredentials({ workspaceId: value });
  }, [updateCredentials]);

  const clearCredentials = useCallback(() => {
    setApiToken('');
    setAppId('');
    setWorkspaceId('');
    credentialStorage.clear();
  }, [credentialStorage]);

  return {
    apiToken,
    appId,
    workspaceId,
    isLoaded,
    setApiToken: updateApiToken,
    setAppId: updateAppId,
    setWorkspaceId: updateWorkspaceId,
    clearCredentials,
  };
}
