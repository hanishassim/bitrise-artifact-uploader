import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Smartphone, Apple, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { listConnectedApps, ConnectedApp } from '@/lib/bitriseApi';

interface AppSelectorProps {
  apiToken: string;
  workspaceId: string;
  organizationName: string;
  isConnected: boolean;
  selectedAppId: string | null;
  lastUsedAppId: string | null;
  onAppSelect: (app: ConnectedApp) => void;
  addApiLog: (log: { curlCommand?: string; logs?: string[] }) => void;
}

export function AppSelector({
  apiToken,
  workspaceId,
  organizationName,
  isConnected,
  selectedAppId,
  lastUsedAppId,
  onAppSelect,
  addApiLog,
}: AppSelectorProps) {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'ios' | 'android'>('all');

  const fetchApps = useCallback(async () => {
    if (!isConnected || !apiToken || !workspaceId) return;

    setIsLoading(true);
    setError(null);

    const result = await listConnectedApps(apiToken, workspaceId);

    addApiLog({
      curlCommand: result.curlCommand,
      logs: result.logs,
    });

    if (result.success && result.data) {
      setApps(result.data);
    } else {
      setError(result.error || 'Failed to load apps');
    }

    setIsLoading(false);
  }, [isConnected, apiToken, workspaceId, addApiLog]);

  useEffect(() => {
    // Reset apps when connection status changes
    if (!isConnected) {
      setApps([]);
      setError(null);
      setSearchQuery('');
    } else {
      fetchApps();
    }
  }, [isConnected, fetchApps]);


  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      // Platform filter
      if (platformFilter !== 'all') {
        if (platformFilter === 'ios' && app.platform !== 'ios') return false;
        if (platformFilter === 'android' && app.platform !== 'android') return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          app.app_name?.toLowerCase().includes(query) ||
          app.project_title?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [apps, platformFilter, searchQuery]);


  if (!isConnected) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Smartphone className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Connect to Bitrise to view your apps
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Select App {organizationName && <span className="text-muted-foreground">for {organizationName}</span>}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchApps}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={platformFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatformFilter('all')}
              className="px-3"
            >
              All
            </Button>
            <Button
              variant={platformFilter === 'ios' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setPlatformFilter('ios')}
              title="iOS apps"
            >
              <Apple className="h-4 w-4" />
            </Button>
            <Button
              variant={platformFilter === 'android' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setPlatformFilter('android')}
              title="Android apps"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchApps} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apps List */}
        {!isLoading && !error && (
          <ScrollArea className="h-auto max-h-96 pr-2">
            <div className="space-y-2">
              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Smartphone className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || platformFilter !== 'all' 
                      ? 'No apps match your filter' 
                      : 'No connected apps found'}
                  </p>
                </div>
              ) : (
                filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => onAppSelect(app)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent/50 ${
                      selectedAppId === app.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border/50 bg-muted/30 hover:border-primary/50'
                    }`}
                  >
                    {/* App Icon */}
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {app.icon_url ? (
                        <img 
                          src={app.icon_url} 
                          alt={app.app_name || 'App icon'} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {app.platform === 'ios' ? (
                            <Apple className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {/* Platform badge */}
                      <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 ${
                        app.platform === 'ios' ? 'bg-muted-foreground' : 'bg-primary'
                      }`}>
                        {app.platform === 'ios' ? (
                          <Apple className="h-2.5 w-2.5 text-primary-foreground" />
                        ) : (
                          <Smartphone className="h-2.5 w-2.5 text-primary-foreground" />
                        )}
                      </div>
                    </div>

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-foreground">
                          {app.app_name || 'Unnamed App'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.project_title}
                      </p>
                      {app.store_app_id && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                          ID: {app.store_app_id}
                        </p>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {selectedAppId === app.id && (
                      <div className="flex-shrink-0 rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
