import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Terminal, ChevronUp, ChevronDown, Trash2, Copy, Zap } from 'lucide-react';
import { ApiLog } from '@/hooks/useApiLogs';

interface ApiLogPanelProps {
  logs: ApiLog[];
  onClear: () => void;
}

export function ApiLogPanel({ logs, onClear }: ApiLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end">
        {isOpen && (
          <Card className="mb-2 w-[500px] max-w-lg border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-medium">API Logs</CardTitle>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onClear} className="h-7 w-7">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear logs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-72">
                <div className="p-4 text-xs font-mono">
                  {logs.length === 0 ? (
                    <p className="text-center text-muted-foreground">No logs yet.</p>
                  ) : (
                    [...logs].reverse().map((log, index) => (
                      <div key={index} className="group relative mb-3 rounded bg-background/50 p-2 border">
                        <p className="text-muted-foreground mb-1 font-semibold">{log.timestamp}</p>
                        {log.curlCommand && (
                          <div className="relative mt-1 rounded bg-black p-2 text-white">
                            <pre className="whitespace-pre-wrap break-all pr-6">{log.curlCommand}</pre>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 text-white hover:text-white hover:bg-white/10"
                                    onClick={() => handleCopy(log.curlCommand!)}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy cURL command</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                        {log.logs.length > 0 && (
                          <div className="mt-2 space-y-1 text-muted-foreground">
                            {log.logs.map((line, i) => (
                              <p key={i} className="flex items-start gap-2">
                                <span className="text-primary/50">▸</span>
                                <span className="flex-1">{line}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full shadow-lg"
        >
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <Terminal className="h-5 w-5" />}
          <span className="ml-2">API Logs</span>
        </Button>
      </div>
    </div>
  );
}
