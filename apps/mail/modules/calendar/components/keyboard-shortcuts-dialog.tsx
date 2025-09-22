"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Shortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsDialogProps {
  shortcuts: Shortcut[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ shortcuts, open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
