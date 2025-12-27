import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { testConnection } from '@/lib/bitriseApi';

interface AuthPanelProps {
  apiToken: string;
  workspaceId: string;
  onApiTokenChange: (value: string) => void;
  onWorkspaceIdChange: (value: string) => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  addCurlLog: (command: string) => void;
}

export function AuthPanel({
  apiToken,
  workspaceId,
  onApiTokenChange,
  onWorkspaceIdChange,
  isConnected,
  onConnectionChange,
  addCurlLog,
}: AuthPanelProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = useCallback(async () => {
    if (!apiToken.trim() || !workspaceId.trim()) {
      setTestResult({ success: false, message: 'API token and Workspace ID are required' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testConnection(apiToken, workspaceId);

    if (result.curlCommand) {
      addCurlLog(result.curlCommand);
    }

    if (result.success) {
      setTestResult({ success: true, message: 'Connected successfully!' });
      onConnectionChange(true);
    } else {
      setTestResult({ success: false, message: result.message || 'Connection failed' });
      onConnectionChange(false);
    }

    setTesting(false);
  }, [apiToken, workspaceId, addCurlLog, onConnectionChange]);

  useEffect(() => {
    if (apiToken.trim() && workspaceId.trim() && !isConnected && !testing) {
      const timer = setTimeout(() => {
        handleTestConnection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [apiToken, workspaceId, isConnected, testing, handleTestConnection]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Authentication</CardTitle>
            <CardDescription>Enter your Bitrise credentials</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-token">API Token</Label>
          <Input
            id="api-token"
            type="password"
            placeholder="Enter your Bitrise API token"
            value={apiToken}
            onChange={(e) => {
              onApiTokenChange(e.target.value);
              onConnectionChange(false);
              setTestResult(null);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-id">Workspace ID</Label>
          <Input
            id="workspace-id"
            type="text"
            placeholder="Enter your Workspace ID"
            value={workspaceId}
            onChange={(e) => {
              onWorkspaceIdChange(e.target.value);
              onConnectionChange(false);
              setTestResult(null);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={testing || !apiToken.trim() || !workspaceId.trim()}
            variant="secondary"
            className="flex-shrink-0"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Connected
              </>
            ) : (
              'Connect'
            )}
          </Button>
          {testResult && !isConnected && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
