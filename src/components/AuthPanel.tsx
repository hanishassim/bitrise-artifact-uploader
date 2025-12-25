import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, CheckCircle, XCircle } from 'lucide-react';

interface AuthPanelProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  appId?: string;
}

export function AuthPanel({ isConnected, onConnect, onDisconnect, appId }: AuthPanelProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Authentication</CardTitle>
            <CardDescription>
              {isConnected ? 'You are connected to Bitrise' : 'Connect to your Bitrise account'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Connected to App ID: {appId}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={onConnect}>Connect to Bitrise</Button>
        )}
      </CardContent>
    </Card>
  );
}
