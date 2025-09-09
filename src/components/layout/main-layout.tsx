"use client";
import { Sidebar } from '@/components/sidebar/sidebar';
import { RequestView } from '@/components/request/request-view';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export function MainLayout() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>
            <RequestView />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
