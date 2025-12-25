import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, Trash2, FileUp, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { UploadRecord } from '@/hooks/useUploadHistory';
import { formatFileSize } from '@/lib/fileHash';

interface UploadHistoryProps {
  history: UploadRecord[];
  onClearHistory: () => void;
}

export function UploadHistory({ history, onClearHistory }: UploadHistoryProps) {
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
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="group flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {record.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium" title={record.fileName}>
                          {record.fileName}
                        </p>
                        <Badge
                          variant={getFileTypeBadgeVariant(record.fileType)}
                          className="flex-shrink-0 text-xs uppercase"
                        >
                          {record.fileType}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(record.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(record.uploadDate)}</span>
                      </div>
                      <p
                        className="mt-1 truncate font-mono text-xs text-muted-foreground/70"
                        title={record.sha256Hash}
                      >
                        {record.sha256Hash.substring(0, 32)}...
                      </p>
                    </div>
                  </div>

                  {record.publicInstallPageUrl && (
                    <a
                      href={record.publicInstallPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex-shrink-0"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
