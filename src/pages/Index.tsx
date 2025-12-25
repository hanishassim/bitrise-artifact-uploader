import { useState } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { UploadZone } from '@/components/UploadZone';
import { UploadHistory } from '@/components/UploadHistory';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import { Rocket } from 'lucide-react';
import { BitriseInstructionModal } from '@/components/BitriseInstructionModal';

const Index = () => {
  const [apiToken, setApiToken] = useState('');
  const [appId, setAppId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { history, addRecord, clearHistory } = useUploadHistory();

  const handleConnect = (newApiToken: string, newAppId: string) => {
    setApiToken(newApiToken);
    setAppId(newAppId);
    setIsConnected(true);
    setIsModalOpen(false);
  };

  const handleDisconnect = () => {
    setApiToken('');
    setAppId('');
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-3xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bitrise Artifact Uploader
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload IPA, APK, and AAB files to Bitrise Release Management
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <AuthPanel
            isConnected={isConnected}
            onConnect={() => setIsModalOpen(true)}
            onDisconnect={handleDisconnect}
            appId={appId}
          />

          <UploadZone
            apiToken={apiToken}
            appId={appId}
            isConnected={isConnected}
            onUploadComplete={addRecord}
          />

          <UploadHistory
            history={history}
            onClearHistory={clearHistory}
          />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Credentials are never stored • All processing happens in your browser
        </p>
      </div>
      <BitriseInstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default Index;
