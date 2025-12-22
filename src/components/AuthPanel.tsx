import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { testConnection } from '@/lib/bitriseApi';

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
  appId,
  onApiTokenChange,
  onAppIdChange,
  isConnected,
  onConnectionChange,
}: AuthPanelProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    if (!apiToken.trim() || !appId.trim()) {
      setTestResult({ success: false, message: 'Please enter both API token and App ID' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testConnection(apiToken, appId);
    setTestResult(result);
    onConnectionChange(result.success);
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
          <Label htmlFor="app-id">Connected App ID</Label>
          <Input
            id="app-id"
            type="text"
            placeholder="Enter your Connected App ID"
            value={appId}
            onChange={(e) => {
              onAppIdChange(e.target.value);
              onConnectionChange(false);
              setTestResult(null);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={testing || !apiToken.trim() || !appId.trim()}
            variant="secondary"
            className="flex-shrink-0"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
