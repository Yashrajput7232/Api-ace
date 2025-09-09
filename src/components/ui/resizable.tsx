"use client"

import { PanelGroup as PanelGroupPrimitive, Panel as ResizablePanelPrimitive, PanelResizeHandle as ResizableHandlePrimitive } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = PanelGroupPrimitive

const ResizablePanel = ResizablePanelPrimitive

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}) => (
  <ResizableHandlePrimitive
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <div className="h-2.5 w-px bg-muted-foreground" />
      </div>
    )}
  </ResizableHandlePrimitive>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
