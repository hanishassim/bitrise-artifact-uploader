import { useState, useEffect, useCallback } from 'react';

const LAST_ARTIFACT_KEY = 'bitrise-last-artifact';

export interface LastArtifactInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export function useLastArtifact() {
  const [lastArtifact, setLastArtifact] = useState<LastArtifactInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_ARTIFACT_KEY);
    if (stored) {
      try {
        setLastArtifact(JSON.parse(stored));
      } catch {
        // Invalid stored data
      }
    }
  }, []);

  const saveLastArtifact = useCallback((file: File) => {
    const info: LastArtifactInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
    setLastArtifact(info);
    localStorage.setItem(LAST_ARTIFACT_KEY, JSON.stringify(info));
  }, []);

  const clearLastArtifact = useCallback(() => {
    setLastArtifact(null);
    localStorage.removeItem(LAST_ARTIFACT_KEY);
  }, []);

  return { lastArtifact, saveLastArtifact, clearLastArtifact };
}
