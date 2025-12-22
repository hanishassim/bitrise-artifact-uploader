import { useState, useEffect, useCallback } from 'react';

export interface UploadRecord {
  id: string;
  fileName: string;
  fileType: 'ipa' | 'apk' | 'aab';
  fileSize: number;
  uploadDate: string;
  status: 'success' | 'failed';
  sha256Hash: string;
}

const STORAGE_KEY = 'bitrise-upload-history';
const MAX_HISTORY_ITEMS = 50;

export function useUploadHistory() {
  const [history, setHistory] = useState<UploadRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const addRecord = useCallback((record: Omit<UploadRecord, 'id' | 'uploadDate'>) => {
    const newRecord: UploadRecord = {
      ...record,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString(),
    };
    
    setHistory(prev => {
      const updated = [newRecord, ...prev].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addRecord, clearHistory };
}
