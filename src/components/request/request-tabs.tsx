"use client";

import type { RequestTab } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyValueEditor } from './key-value-editor';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface RequestTabsProps {
  tab: RequestTab;
  onUpdate: (update: Partial<RequestTab>) => void;
}

export function RequestTabs({ tab, onUpdate }: RequestTabsProps) {
  const hasBody = tab.method !== 'GET' && tab.method !== 'HEAD';

  return (
    <Tabs defaultValue="params" className="flex-1 flex flex-col">
      <TabsList>
        <TabsTrigger value="params">
          Params <Badge variant="secondary" className="ml-2">{tab.params.filter(p => p.enabled).length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="headers">
          Headers <Badge variant="secondary" className="ml-2">{tab.headers.filter(h => h.enabled).length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="body" disabled={!hasBody}>Body</TabsTrigger>
      </TabsList>
      <TabsContent value="params" className="flex-1 overflow-auto p-1">
        <KeyValueEditor
          items={tab.params}
          onChange={(newParams) => onUpdate({ params: newParams })}
        />
      </TabsContent>
      <TabsContent value="headers" className="flex-1 overflow-auto p-1">
        <KeyValueEditor
          items={tab.headers}
          onChange={(newHeaders) => onUpdate({ headers: newHeaders })}
        />
      </TabsContent>
      <TabsContent value="body" className="flex-1">
        <Textarea
          placeholder='{ "key": "value" }'
          value={tab.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          className="h-full w-full font-mono resize-none"
          disabled={!hasBody}
        />
      </TabsContent>
    </Tabs>
  );
}
