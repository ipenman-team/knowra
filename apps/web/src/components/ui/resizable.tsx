"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group
    className={cn(
      "flex h-full w-full",
      props.orientation === "vertical" && "flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  children,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative z-20 -mx-2 flex w-4 !cursor-col-resize touch-none select-none items-center justify-center bg-transparent focus-visible:outline-none",
      "before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border/70 before:content-['']",
      "aria-[orientation=horizontal]:-my-2 aria-[orientation=horizontal]:mx-0 aria-[orientation=horizontal]:h-4 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:bg-transparent",
      "aria-[orientation=horizontal]:before:left-0 aria-[orientation=horizontal]:before:top-1/2 aria-[orientation=horizontal]:before:h-px aria-[orientation=horizontal]:before:w-full aria-[orientation=horizontal]:before:-translate-y-1/2 aria-[orientation=horizontal]:before:translate-x-0",
      "aria-[orientation=horizontal]:!cursor-row-resize",
      "data-[resize-handle-state=hover]:before:bg-border data-[resize-handle-state=drag]:before:bg-border",
      "aria-[orientation=horizontal]:[&>div]:rotate-90",
      className
    )}
    {...props}
  >
    {children}
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
