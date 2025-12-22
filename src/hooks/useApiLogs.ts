import { useState, useCallback } from 'react';

export interface ApiLog {
  timestamp: string;
  curlCommand?: string;
  logs: string[];
}

export function useApiLogs() {
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const addLog = useCallback((log: { curlCommand?: string; logs?: string[] }) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: ApiLog = {
      timestamp,
      curlCommand: log.curlCommand,
      logs: log.logs || [],
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
