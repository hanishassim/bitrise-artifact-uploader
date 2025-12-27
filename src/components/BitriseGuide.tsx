import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Key, Hash } from 'lucide-react';

export function BitriseGuide() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/50">
            <ExternalLink className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Where to get credentials</CardTitle>
            <CardDescription>Find your API Token and Connected App ID</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
            <Key className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">API Token</p>
              <p className="text-xs text-muted-foreground mt-1">
                Account Settings → Security (left panel) → Personal access tokens → Create or edit token
              </p>
              <a
                href="https://app.bitrise.io/me/profile#/security"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open Personal Access Tokens
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
            <Hash className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Connected App ID</p>
              <p className="text-xs text-muted-foreground mt-1">
                In Release Management, go to your connected app → Settings → General. The Connected App ID is shown at the top.
              </p>
              <a
                href="https://app.bitrise.io/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open Release Management
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Need help?{' '}
          <a
            href="https://devcenter.bitrise.io/en/api/authentication.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View Bitrise API docs
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
