import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, Trash2, FileUp, CheckCircle, XCircle, Copy, Check, ChevronDown } from 'lucide-react';
import { UploadRecord } from '@/hooks/useUploadHistory';
import { formatFileSize } from '@/lib/fileHash';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface UploadHistoryProps {
  history: UploadRecord[];
  onClearHistory: () => void;
}

export function UploadHistory({ history, onClearHistory }: UploadHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (record: UploadRecord) => {
    const url = record.publicInstallPageUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(record.id);
      toast({
        title: 'Link copied!',
        description: 'Install page URL copied to clipboard',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'ipa':
        return 'default';
      case 'apk':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Upload History</CardTitle>
              <CardDescription>Recent uploads stored locally</CardDescription>
            </div>
          </div>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No uploads yet</p>
          </div>
        ) : (
          <ScrollArea className={`h-auto pr-4 transition-all duration-300 ease-in-out ${expandedId ? 'max-h-[700px]' : 'max-h-[400px]'}`}>
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="group rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {record.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{record.fileName}</p>
                          <Badge variant={getFileTypeBadgeVariant(record.fileType)} className="text-xs uppercase">
                            {record.fileType}
                          </Badge>
                        </div>
                        {record.publicInstallPageUrl && (
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedId === record.id ? 'rotate-180' : ''
                          }`} />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(record.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(record.uploadDate)}</span>
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground/70">
                        {record.sha256Hash.substring(0, 32)}...
                      </p>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedId === record.id && record.publicInstallPageUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>
                          <p className="mb-2 text-sm font-medium text-muted-foreground">Copy and share the link</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={record.publicInstallPageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-0 flex-1 rounded-lg border border-border/50 bg-background px-3 py-2"
                            >
                              <p className="text-sm text-primary break-all">
                                {record.publicInstallPageUrl}
                              </p>
                            </a>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyLink(record)}
                              className="flex-shrink-0"
                            >
                              {copiedId === record.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="mb-2 text-sm font-medium text-muted-foreground">Scan this QR code on your device</p>
                          <div className="inline-block rounded-lg bg-white p-2">
                            <QRCodeSVG value={record.publicInstallPageUrl} size={128} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
