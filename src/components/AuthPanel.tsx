import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { testConnection, getOrganizations, Organization } from '@/lib/bitriseApi';

interface AuthPanelProps {
  apiToken: string;
  onApiTokenChange: (value: string) => void;
  onWorkspaceIdChange: (value: string) => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  addApiLog: (log: { curlCommand?: string; logs?: string[] }) => void;
}

export function AuthPanel({
  apiToken,
  onApiTokenChange,
  onWorkspaceIdChange,
  isConnected,
  onConnectionChange,
  addApiLog,
}: AuthPanelProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [isFetchingOrgs, setIsFetchingOrgs] = useState(false);

  useEffect(() => {
    onConnectionChange(false);
    setTestResult(null);
    setOrganizations([]);
    setSelectedOrg('');
    onWorkspaceIdChange('');
  }, [apiToken, onConnectionChange, onWorkspaceIdChange]);

  const handleTestConnection = useCallback(async () => {
    if (!apiToken.trim()) {
      setTestResult({ success: false, message: 'API token is required' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    onConnectionChange(false);
    setOrganizations([]);
    setSelectedOrg('');
    onWorkspaceIdChange('');

    const result = await testConnection(apiToken);

    addApiLog({
      curlCommand: result.curlCommand,
      logs: result.logs,
    });

    if (result.success) {
      setTestResult({ success: true, message: 'Token is valid, fetching organizations...' });
      setIsFetchingOrgs(true);
      const orgsResult = await getOrganizations(apiToken);
      addApiLog({ curlCommand: orgsResult.curlCommand, logs: orgsResult.logs });
      setIsFetchingOrgs(false);

      if (orgsResult.success && orgsResult.data) {
        if (orgsResult.data.length === 0) {
          setTestResult({ success: false, message: 'No organizations found for this token.' });
        } else {
          setOrganizations(orgsResult.data);
          if (orgsResult.data.length === 1) {
            const org = orgsResult.data[0];
            setSelectedOrg(org.slug);
            onWorkspaceIdChange(org.slug);
            onConnectionChange(true);
            setTestResult({ success: true, message: `Connected to ${org.name}` });
          } else {
            setTestResult({ success: true, message: 'Please select an organization.' });
          }
        }
      } else {
        setTestResult({ success: false, message: orgsResult.error || 'Failed to fetch organizations.' });
      }
    } else {
      setTestResult({ success: false, message: result.message || 'Connection failed' });
    }

    setTesting(false);
  }, [apiToken, addApiLog, onConnectionChange, onWorkspaceIdChange]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Authentication</CardTitle>
            <CardDescription>Enter your Bitrise Personal Access Token</CardDescription>
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
            onChange={(e) => onApiTokenChange(e.target.value)}
          />
        </div>

        {isFetchingOrgs && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fetching organizations...</span>
          </div>
        )}

        {organizations.length > 1 && !isConnected && (
          <div className="space-y-2">
            <Label htmlFor="org-select">Select Organization</Label>
            <Select
              value={selectedOrg}
              onValueChange={(slug) => {
                const orgName = organizations.find(o => o.slug === slug)?.name;
                setSelectedOrg(slug);
                onWorkspaceIdChange(slug);
                onConnectionChange(true);
                setTestResult({ success: true, message: `Connected to ${orgName}` });
              }}
            >
              <SelectTrigger id="org-select" className="bg-background/50">
                <SelectValue placeholder="Choose an organization..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.slug} value={org.slug}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={testing || !apiToken.trim() || (organizations.length > 1 && !isConnected)}
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
             <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
             {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
             <span>{testResult.message}</span>
           </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
