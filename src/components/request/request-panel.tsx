"use client";
import type { RequestTab, HttpMethod } from '@/types';
import { useApiAce } from '@/hooks/use-api-ace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RequestTabs } from './request-tabs';
import { Send, Save, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SuggestParameters } from '../ai/suggest-parameters';
import { useIsMobile } from '@/hooks/use-mobile';

interface RequestPanelProps {
  tab: RequestTab;
}

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export function RequestPanel({ tab }: RequestPanelProps) {
  const { dispatch, sendRequest, cancelRequest } = useApiAce();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleUpdate = (update: Partial<RequestTab>) => {
    dispatch({ type: 'UPDATE_ACTIVE_TAB', payload: update });
  };
  
  const handleSave = () => {
    dispatch({ type: 'SAVE_ACTIVE_TAB' });
    toast({ title: "Request Saved", description: `"${tab.name}" has been saved to its collection.` });
  };
  
  const handleSendOrCancel = () => {
      if (tab.loading) {
          cancelRequest(tab.id);
      } else {
          sendRequest(tab.id);
      }
  }

  const renderDesktopLayout = () => (
    <div className="flex gap-2 items-center">
       <Input
          placeholder="Request Name"
          value={tab.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="h-10 text-lg font-medium flex-shrink w-1/4"
        />
      <div className="flex-1 flex gap-2">
        <Select
          value={tab.method}
          onValueChange={(value: HttpMethod) => handleUpdate({ method: value })}
        >
          <SelectTrigger className="w-[120px] font-bold">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            {methods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="https://api.example.com/data"
          value={tab.url}
          onChange={(e) => handleUpdate({ url: e.target.value })}
          className="flex-1 font-mono"
        />
        <Button onClick={handleSendOrCancel} className="w-28">
          {tab.loading ? (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send
            </>
          )}
        </Button>
        <Button onClick={handleSave} variant="outline" disabled={!tab.isDirty}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
         <SuggestParameters
            onSelect={(param) =>
              handleUpdate({ params: [...tab.params, { id: crypto.randomUUID(), key: param, value: '', enabled: true }]})
            }
         />
      </div>
    </div>
  )

  const renderMobileLayout = () => (
      <div className="flex flex-col gap-2">
           <Input
                placeholder="Request Name"
                value={tab.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                className="h-10 text-lg font-medium"
            />
            <div className="flex gap-2">
                 <Select
                    value={tab.method}
                    onValueChange={(value: HttpMethod) => handleUpdate({ method: value })}
                    >
                    <SelectTrigger className="w-[120px] font-bold">
                        <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                        {methods.map((method) => (
                        <SelectItem key={method} value={method}>
                            {method}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Input
                    placeholder="https://api.example.com/data"
                    value={tab.url}
                    onChange={(e) => handleUpdate({ url: e.target.value })}
                    className="flex-1 font-mono text-sm"
                />
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSendOrCancel} className="flex-1">
                    {tab.loading ? (
                        <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                        </>
                    ) : (
                        <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                        </>
                    )}
                    </Button>
                    <Button onClick={handleSave} variant="outline" disabled={!tab.isDirty}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                    <SuggestParameters
                        onSelect={(param) =>
                            handleUpdate({ params: [...tab.params, { id: crypto.randomUUID(), key: param, value: '', enabled: true }]})
                        }
                    />
            </div>
      </div>
  )

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      <RequestTabs tab={tab} onUpdate={handleUpdate} />
    </div>
  );
}
