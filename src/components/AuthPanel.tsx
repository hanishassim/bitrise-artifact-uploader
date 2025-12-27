import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { listConnectedApps } from '@/lib/bitriseApi';

const WORKSPACE_ID = '7df0c6a424a76e9d';

interface AuthPanelProps {
  apiToken: string;
  appId: string;
  onApiTokenChange: (value: string) => void;
  onAppIdChange: (value: string) => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export function AuthPanel({
  apiToken,
  onApiTokenChange,
  isConnected,
  onConnectionChange,
}: AuthPanelProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-test connection when API token changes and has content
  useEffect(() => {
    if (apiToken.trim() && !isConnected && !testing) {
      // Debounce the auto-test
      const timer = setTimeout(() => {
        handleTestConnection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [apiToken]);

  const handleTestConnection = async () => {
    if (!apiToken.trim()) {
      setTestResult({ success: false, message: 'Please enter your API token' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Test by listing connected apps for the workspace
    const result = await listConnectedApps(apiToken, WORKSPACE_ID);
    
    if (result.success) {
      setTestResult({ success: true, message: 'Connected successfully!' });
      onConnectionChange(true);
    } else {
      setTestResult({ success: false, message: result.error || 'Connection failed' });
      onConnectionChange(false);
    }
    
    setTesting(false);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Authentication</CardTitle>
            <CardDescription>Enter your Bitrise API token</CardDescription>
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
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={testing || !apiToken.trim()}
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
