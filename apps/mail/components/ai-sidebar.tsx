"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export interface AISidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

// Right-side AI sidebar that mirrors the mail app's sidebar usage
// Uses Dialog under the hood and positions the content as a right panel on desktop.
export function AISidebar({ open, onOpenChange, className, children }: PropsWithChildren<AISidebarProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Force drawer-style positioning instead of centered modal
        className={cn(
          // reset default DialogContent centering transforms
          "fixed inset-y-0 right-0 left-auto top-0 bottom-0 translate-x-0 translate-y-0 z-50",
          // sizing & look
          "p-0 gap-0 border-l w-full sm:w-[380px] max-w-none rounded-none h-screen",
          className,
        )}
      >
        {/* Visually hidden title/description for accessibility compliance */}
        <DialogTitle className="sr-only">AI Assistant</DialogTitle>
        <DialogDescription className="sr-only">Interact with the AI copilot.</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
