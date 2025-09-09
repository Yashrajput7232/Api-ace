"use client";

import { useApiAce } from '@/hooks/use-api-ace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequestPanel } from './request-panel';
import { ResponsePanel } from '../response/response-panel';
import { X, Sparkles } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';

export function RequestView() {
  const { state, dispatch } = useApiAce();
  const { activeTabs, activeTabId } = state;
  const isMobile = useIsMobile();


  if (activeTabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Sparkles className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-headline font-semibold">Welcome to API Ace</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Create a new collection or request from the sidebar to get started.
          <br />
          All your data is stored locally in your browser.
        </p>
      </div>
    );
  }

  const activeTab = activeTabs.find(tab => tab.id === activeTabId);
  
  const renderContent = (tab) => {
      if (isMobile) {
          return (
              <div className="h-full flex flex-col">
                  <RequestPanel tab={tab} />
                  <div className="flex-1 min-h-0">
                    <ResponsePanel tab={tab} />
                  </div>
              </div>
          )
      }
      return (
           <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={50} minSize={20}>
                <RequestPanel tab={tab} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={20}>
                <ResponsePanel tab={tab} />
            </ResizablePanel>
           </ResizablePanelGroup>
      )
  }

  return (
    <div className="h-full flex flex-col">
       <Tabs
        value={activeTabId || ''}
        onValueChange={(value) => dispatch({ type: 'SET_ACTIVE_TAB', payload: value })}
        className="flex-1 flex flex-col"
      >
         <div className="overflow-x-auto">
            <TabsList className="m-2 self-start">
              {activeTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative pr-8 group"
                >
                  <span className="truncate">{tab.name}{tab.isDirty && '*'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'CLOSE_TAB', payload: tab.id });
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-1 rounded-sm p-0.5
                               hover:bg-muted-foreground/20 group-hover:opacity-100 opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
         </div>
        <div className="flex-1 overflow-auto">
          {activeTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="h-full m-0 mt-0">
               {renderContent(tab)}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
