import { useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileUp, X, CheckCircle, XCircle, Loader2, Shield, RotateCcw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateSHA256, formatFileSize, isValidArtifactFile, getFileExtension } from '@/lib/fileHash';
import { uploadArtifact, submitWhatsNew, UploadProgress, ArtifactStatus } from '@/lib/bitriseApi';
import { UploadRecord } from '@/hooks/useUploadHistory';
import { ConnectedApp } from '@/lib/bitriseApi';
import { LastArtifactInfo } from '@/hooks/useLastArtifact';
import { toast } from '@/hooks/use-toast';

interface UploadZoneProps {
  apiToken: string;
  appId: string;
  selectedApp: ConnectedApp | null;
  isConnected: boolean;
  onUploadComplete: (record: Omit<UploadRecord, 'id' | 'uploadDate'>) => void;
  lastArtifact: LastArtifactInfo | null;
  onFileSave: (file: File) => void;
  onClearLastArtifact: () => void;
  addApiLog: (log: { curlCommand?: string; logs?: string[] }) => void;
}

type UploadState = 'idle' | 'hashing' | 'uploading' | 'success' | 'error';

export function UploadZone({ apiToken, appId, selectedApp, isConnected, onUploadComplete, lastArtifact, onFileSave, onClearLastArtifact, addApiLog }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [whatsNew, setWhatsNew] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [artifactStatus, setArtifactStatus] = useState<ArtifactStatus | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!isValidArtifactFile(file)) {
      setErrorMessage('Invalid file type. Please select an IPA, APK, or AAB file.');
      setUploadState('error');
      return;
    }

    setSelectedFile(file);
    onFileSave(file);
    setUploadState('hashing');
    setErrorMessage('');
    setFileHash('');

    try {
      const hash = await calculateSHA256(file);
      setFileHash(hash);
      setUploadState('idle');
    } catch {
      setErrorMessage('Failed to calculate file hash');
      setUploadState('error');
    }
  }, [onFileSave]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!selectedFile || !apiToken || !appId) return;

    const controller = new AbortController();
    setAbortController(controller);
    setUploadState('uploading');
    setProgress(null);
    setArtifactStatus(null);
    setCopied(false);

    try {
      const platform = selectedApp?.platform || 'ios';
      const result = await uploadArtifact(
        selectedFile,
        apiToken,
        appId,
        platform,
        setProgress,
        controller,
        addApiLog
      );

      if (result.success && result.artifactId) {
        setUploadState('success');

        // Submit "What's New" if text is provided
        if (whatsNew.trim()) {
          const whatsNewResult = await submitWhatsNew(apiToken, appId, result.artifactId, whatsNew.trim());
          addApiLog({ curlCommand: whatsNewResult.curlCommand, logs: whatsNewResult.logs });
        }

        // Artifact status with public URL is already handled in checkArtifactStatus
        setArtifactStatus(result.artifactStatus || null);

        onUploadComplete({
          fileName: selectedFile.name,
          fileType: getFileExtension(selectedFile.name) as 'ipa' | 'apk' | 'aab',
          fileSize: selectedFile.size,
          status: 'success',
          sha256Hash: fileHash,
          publicInstallPageUrl: result.artifactStatus?.public_install_page_url,
        });
      } else {
        setUploadState('error');
        setErrorMessage(result.message);
        onUploadComplete({
          fileName: selectedFile.name,
          fileType: getFileExtension(selectedFile.name) as 'ipa' | 'apk' | 'aab',
          fileSize: selectedFile.size,
          status: 'failed',
          sha256Hash: fileHash,
        });
      }
    } catch (error) {
      if ((error as Error).message === 'Upload cancelled') {
        setUploadState('idle');
      } else {
        setUploadState('error');
        setErrorMessage('Upload failed unexpectedly');
      }
    } finally {
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    abortController?.abort();
    setUploadState('idle');
    setProgress(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileHash('');
    setWhatsNew('');
    setUploadState('idle');
    setProgress(null);
    setErrorMessage('');
    setArtifactStatus(null);
    setCopied(false);
    onClearLastArtifact();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyLink = async () => {
    const url = artifactStatus?.public_install_page_url;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Install page URL copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".ipa,.apk,.aab"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => isConnected && fileInputRef.current?.click()}
              className={cn(
                'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                !isConnected && 'cursor-not-allowed opacity-50'
              )}
            >
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300',
                isDragging && 'scale-110'
              )}>
                <Upload className={cn(
                  'h-8 w-8 text-primary transition-transform duration-300',
                  isDragging && 'animate-bounce'
                )} />
              </div>
              <p className="mt-4 text-center font-medium text-foreground">
                {isConnected ? 'Drop your artifact here' : 'Connect to Bitrise first'}
              </p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {isConnected ? 'or click to browse • IPA, APK, AAB supported' : 'Test your connection above to enable uploads'}
              </p>
            </div>

            {/* Last used artifact hint */}
            {lastArtifact && isConnected && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer rounded-lg border border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/50 hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {lastArtifact.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(lastArtifact.size)} • Click to select from your device
                    </p>
                  </div>
                  <RotateCcw className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              {uploadState === 'idle' && (
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Hash Info */}
            {uploadState === 'hashing' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating file integrity hash...</span>
              </div>
            )}

            {/* What's New Input */}
            {fileHash && uploadState === 'idle' && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">What's new? (Optional)</p>
                <Textarea
                  value={whatsNew}
                  onChange={(e) => setWhatsNew(e.target.value)}
                  placeholder="Enter release notes for this artifact..."
                  className="bg-muted/30"
                />
              </div>
            )}

            {fileHash && uploadState !== 'hashing' && (
              <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">SHA-256</p>
                  <p className="break-all font-mono text-xs text-foreground/80">{fileHash}</p>
                </div>
              </div>
            )}

            {/* Progress */}
            {uploadState === 'uploading' && progress && (
              <div className="space-y-3">
                <Progress value={progress.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatSpeed(progress.speed)}</span>
                  <span>~{formatTime(progress.estimatedTimeRemaining)} remaining</span>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadState === 'success' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Upload successful!</span>
                </div>

                {artifactStatus?.public_install_page_url && (
                  <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Copy and share the link</p>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1 rounded-lg border border-border/50 bg-background px-3 py-2">
                          <p className="truncate text-sm text-primary break-all">
                            {artifactStatus.public_install_page_url}
                          </p>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleCopyLink} className="flex-shrink-0">
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Scan this QR code on your device</p>
                      <div className="inline-block rounded-lg bg-white p-2">
                        <QRCodeSVG value={artifactStatus.public_install_page_url} size={128} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadState === 'error' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {uploadState === 'idle' && fileHash && (
                <Button onClick={handleUpload} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to Bitrise
                </Button>
              )}

              {uploadState === 'uploading' && (
                <Button onClick={handleCancel} variant="destructive" className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Cancel Upload
                </Button>
              )}

              {(uploadState === 'success' || uploadState === 'error') && (
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Upload Another
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
