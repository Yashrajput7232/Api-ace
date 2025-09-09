"use client";
import { Sidebar } from '@/components/sidebar/sidebar';
import { RequestView } from '@/components/request/request-view';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider } from '../ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { PanelLeft } from 'lucide-react';

export function MainLayout() {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <div className="h-screen w-screen flex flex-col">
                <header className="flex items-center justify-between p-2 border-b">
                     <h1 className="text-lg font-headline font-bold text-primary">API Ace</h1>
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <PanelLeft className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-3/4 flex flex-col">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="text-left text-2xl font-headline font-bold text-primary">API Ace</SheetTitle>
                            </SheetHeader>
                           <div className="flex-1 overflow-y-auto">
                             <Sidebar />
                           </div>
                        </SheetContent>
                     </Sheet>
                </header>
                <div className="flex-1 overflow-hidden">
                    <RequestView />
                </div>
            </div>
        )
    }

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
