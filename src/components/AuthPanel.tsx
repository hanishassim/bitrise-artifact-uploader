import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getOrganizations, Organization } from '@/lib/bitriseApi';

interface AuthPanelProps {
  apiToken: string;
  workspaceId: string;
  onApiTokenChange: (value: string) => void;
  onWorkspaceIdChange: (value: string) => void;
  onOrganizationNameChange: (value: string) => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  addApiLog: (log: { curlCommand?: string; logs?: string[] }) => void;
}

export function AuthPanel({
  apiToken,
  workspaceId,
  onApiTokenChange,
  onWorkspaceIdChange,
  onOrganizationNameChange,
  isConnected,
  onConnectionChange,
  addApiLog,
}: AuthPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOrgsFetched, setIsOrgsFetched] = useState(false);

  useEffect(() => {
    onConnectionChange(false);
    setTestResult(null);
    setOrganizations([]);
    setIsOrgsFetched(false);
    onWorkspaceIdChange('');
    onOrganizationNameChange('');
  }, [apiToken, onConnectionChange, onWorkspaceIdChange, onOrganizationNameChange]);

  const handleFetchOrganizations = useCallback(async () => {
    if (!apiToken.trim()) {
      setTestResult({ success: false, message: 'API token is required' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    onConnectionChange(false);
    setOrganizations([]);
    onWorkspaceIdChange('');
    onOrganizationNameChange('');

    const orgsResult = await getOrganizations(apiToken);
    addApiLog({ curlCommand: orgsResult.curlCommand, logs: orgsResult.logs });

    if (orgsResult.success && orgsResult.data) {
      if (orgsResult.data.length === 0) {
        setTestResult({ success: false, message: 'No organizations found for this token.' });
      } else {
        setOrganizations(orgsResult.data);
        setIsOrgsFetched(true);
        if (orgsResult.data.length === 1) {
          const org = orgsResult.data[0];
          onWorkspaceIdChange(org.slug);
          onOrganizationNameChange(org.name);
          onConnectionChange(true);
          setTestResult({ success: true, message: `Connected to ${org.name}` });
        } else {
          setTestResult(null);
        }
      }
    } else {
      setTestResult({ success: false, message: orgsResult.error || 'Failed to fetch organizations.' });
    }

    setIsLoading(false);
  }, [apiToken, addApiLog, onConnectionChange, onWorkspaceIdChange, onOrganizationNameChange]);

  const handleOrgSelect = (slug: string) => {
    const org = organizations.find(o => o.slug === slug);
    if (org) {
      onWorkspaceIdChange(org.slug);
      onOrganizationNameChange(org.name);
      onConnectionChange(true);
      setTestResult({ success: true, message: `Connected to ${org.name}` });
    }
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
            <CardDescription>Connect to your Bitrise account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-token">Personal Access Token</Label>
          <Input
            id="api-token"
            type="password"
            placeholder="Enter your Bitrise PAT"
            value={apiToken}
            onChange={(e) => onApiTokenChange(e.target.value)}
          />
        </div>

        {!isOrgsFetched ? (
          <Button onClick={handleFetchOrganizations} disabled={isLoading || !apiToken.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect
          </Button>
        ) : organizations.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="org-select">Select Organization</Label>
            <Select value={workspaceId} onValueChange={handleOrgSelect}>
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

        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
