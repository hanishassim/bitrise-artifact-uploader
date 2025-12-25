import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testConnection } from '@/lib/bitriseApi';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface BitriseInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (apiToken: string, appId: string) => void;
}

export function BitriseInstructionModal({ isOpen, onClose, onConnect }: BitriseInstructionModalProps) {
  const [apiToken, setApiToken] = useState('');
  const [appId, setAppId] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestAndConnect = async () => {
    if (!apiToken.trim() || !appId.trim()) {
      setTestResult({ success: false, message: 'Please enter both API token and App ID' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testConnection(apiToken, appId);
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      onConnect(apiToken, appId);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Bitrise</DialogTitle>
          <DialogDescription>
            Follow these steps and enter your credentials below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold">Step 1: Get your API Token</h3>
            <p className="text-sm text-muted-foreground">
              Find your Personal Access Token in your Bitrise account
              under{' '}
              <a
                href="https://app.bitrise.io/me/profile#/security"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                Settings &gt; Security
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Step 2: Get your App ID</h3>
            <p className="text-sm text-muted-foreground">
              Navigate to your app on Bitrise. The App ID is in the URL (e.g., `app.bitrise.io/app/YOUR_APP_ID`).
            </p>
          </div>
          <div className="space-y-2 pt-4">
            <Label htmlFor="modal-api-token">API Token</Label>
            <Input
              id="modal-api-token"
              type="password"
              placeholder="Enter your Bitrise API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-app-id">Connected App ID</Label>
            <Input
              id="modal-app-id"
              type="text"
              placeholder="Enter your Connected App ID"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
             <Button
                onClick={handleTestAndConnect}
                disabled={testing || !apiToken.trim() || !appId.trim()}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Save & Connect'
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
