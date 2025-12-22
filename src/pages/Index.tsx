import { useState } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { BitriseGuide } from '@/components/BitriseGuide';
import { AppSelector } from '@/components/AppSelector';
import { UploadZone } from '@/components/UploadZone';
import { UploadHistory } from '@/components/UploadHistory';
import { ApiLogPanel } from '@/components/ApiLogPanel';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import { usePersistedCredentials } from '@/hooks/usePersistedCredentials';
import { useLastArtifact } from '@/hooks/useLastArtifact';
import { useLastUsedApp } from '@/hooks/useLastUsedApp';
import { useApiLogs } from '@/hooks/useApiLogs';
import { ConnectedApp } from '@/lib/bitriseApi';
import { Rocket } from 'lucide-react';

const Index = () => {
  const {
    apiToken,
    appId,
    workspaceId,
    isLoaded,
    setApiToken,
    setAppId,
    setWorkspaceId,
  } = usePersistedCredentials();
  const { lastArtifact, saveLastArtifact, clearLastArtifact } = useLastArtifact();
  const { lastUsedAppId, saveLastUsedApp } = useLastUsedApp();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ConnectedApp | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const { history, addRecord, clearHistory } = useUploadHistory();
  const { logs, addLog, clearLogs } = useApiLogs();

  const handleAppSelect = (app: ConnectedApp) => {
    setSelectedApp(app);
    setAppId(app.id);
    saveLastUsedApp(app.id);
  };

  if (!isLoaded) {
    return null; // Wait for credentials to load
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/30">
      <div className="container max-w-7xl py-8 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Rocket className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bitrise Artifact Uploader
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload IPA, APK, and AAB files to Bitrise Release Management
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Authentication & Guide */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8 space-y-6">
              <AuthPanel
                apiToken={apiToken}
                workspaceId={workspaceId}
                onApiTokenChange={setApiToken}
                onWorkspaceIdChange={setWorkspaceId}
                onOrganizationNameChange={setOrganizationName}
                onOrganizationChange={() => setSelectedApp(null)}
                isConnected={isConnected}
                onConnectionChange={setIsConnected}
                addApiLog={addLog}
              />
              <BitriseGuide />
            </div>
          </div>

          {/* Right Column - App Selector, Uploader and History */}
          <div className="lg:col-span-8 space-y-6">
            <AppSelector
              apiToken={apiToken}
              workspaceId={workspaceId}
              organizationName={organizationName}
              isConnected={isConnected}
              selectedAppId={selectedApp?.id || appId || null}
              lastUsedAppId={lastUsedAppId}
              onAppSelect={handleAppSelect}
              addApiLog={addLog}
            />

            <UploadZone
              apiToken={apiToken}
              appId={selectedApp?.id || appId}
              selectedApp={selectedApp}
              isConnected={isConnected && !!(selectedApp?.id || appId)}
              onUploadComplete={addRecord}
              lastArtifact={lastArtifact}
              onFileSave={saveLastArtifact}
              onClearLastArtifact={clearLastArtifact}
              addApiLog={addLog}
            />

            <UploadHistory
              history={history}
              onClearHistory={clearHistory}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Credentials are never stored • All processing happens in your browser
        </p>
      </div>

      <ApiLogPanel logs={logs} onClear={clearLogs} />
    </div>
  );
};

export default Index;
