import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Terminal, ChevronUp, ChevronDown, Trash2, Copy } from 'lucide-react';
import { CurlLog } from '@/hooks/useCurlLogs';

interface CurlLogPanelProps {
  logs: CurlLog[];
  onClear: () => void;
}

export function CurlLogPanel({ logs, onClear }: CurlLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end">
        {isOpen && (
          <Card className="mb-2 w-96 max-w-lg border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-medium">cURL Logs</CardTitle>
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
              <ScrollArea className="h-64">
                <div className="p-4 text-xs font-mono">
                  {logs.length === 0 ? (
                    <p className="text-center text-muted-foreground">No logs yet.</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="group relative mb-2 rounded bg-background/50 p-2">
                        <p className="text-muted-foreground mb-1">{log.timestamp}</p>
                        <p className="break-words pr-6">{log.command}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => handleCopy(log.command)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy command</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          <span className="ml-2">cURL Logs</span>
        </Button>
      </div>
    </div>
  );
}
