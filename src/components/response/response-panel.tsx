"use client";
import type { RequestTab } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ServerCrash, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ResponsePanelProps {
  tab: RequestTab;
}

export function ResponsePanel({ tab }: ResponsePanelProps) {
  const { response, loading } = tab;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-headline font-semibold">No Response</h2>
        <p className="text-muted-foreground mt-2">Send a request to see the response here.</p>
      </div>
    );
  }

  const isError = response.status === 0 || response.status >= 400;

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-headline font-semibold">Response</h2>
        <Badge variant={isError ? 'destructive' : 'default'} className="text-base">
          Status: {response.status} {response.statusText}
        </Badge>
        <Badge variant="secondary">Time: {response.time}ms</Badge>
        <Badge variant="secondary">Size: {(response.size / 1024).toFixed(2)} KB</Badge>
      </div>

      <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="flex-1 overflow-auto mt-2">
            <ScrollArea className="h-full rounded-md border">
                <pre className="p-4 text-sm">
                    <code>{JSON.stringify(response.data, null, 2)}</code>
                </pre>
            </ScrollArea>
        </TabsContent>
        <TabsContent value="headers" className="flex-1 overflow-auto mt-2">
            <ScrollArea className="h-full rounded-md border p-4">
            <div className="space-y-1">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <strong className="font-semibold text-primary">{key}:</strong>
                  <span className="break-all">{value}</span>
                </div>
              ))}
            </div>
            </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
