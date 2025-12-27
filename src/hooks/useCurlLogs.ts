import { useState, useCallback } from 'react';

export interface CurlLog {
  timestamp: string;
  command: string;
}

export function useCurlLogs() {
  const [logs, setLogs] = useState<CurlLog[]>([]);

  const addLog = useCallback((command: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, command }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
