import { useState } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { UploadZone } from '@/components/UploadZone';
import { UploadHistory } from '@/components/UploadHistory';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import { usePersistedCredentials } from '@/hooks/usePersistedCredentials';
import { useLastArtifact } from '@/hooks/useLastArtifact';
import { Rocket } from 'lucide-react';

const Index = () => {
  const { apiToken, appId, isLoaded, setApiToken, setAppId } = usePersistedCredentials();
  const { lastArtifact, saveLastArtifact, clearLastArtifact } = useLastArtifact();
  const [isConnected, setIsConnected] = useState(false);
  const { history, addRecord, clearHistory } = useUploadHistory();

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
          {/* Left Column - Authentication */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <AuthPanel
                apiToken={apiToken}
                appId={appId}
                onApiTokenChange={setApiToken}
                onAppIdChange={setAppId}
                isConnected={isConnected}
                onConnectionChange={setIsConnected}
              />
            </div>
          </div>

          {/* Right Column - Uploader and History */}
          <div className="lg:col-span-8 space-y-6">
            <UploadZone
              apiToken={apiToken}
              appId={appId}
              isConnected={isConnected}
              onUploadComplete={addRecord}
              lastArtifact={lastArtifact}
              onFileSave={saveLastArtifact}
              onClearLastArtifact={clearLastArtifact}
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
    </div>
  );
};

export default Index;
