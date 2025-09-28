import { useEffect, useCallback } from 'react';

export interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = 
          event.key === shortcut.key || 
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.code === shortcut.key;

        const modifiersMatch = 
          (!!shortcut.ctrlKey === !!event.ctrlKey) &&
          (!!shortcut.altKey === !!event.altKey) &&
          (!!shortcut.shiftKey === !!event.shiftKey) &&
          (!!shortcut.metaKey === !!event.metaKey);

        if (keyMatches && modifiersMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getShortcutsList = useCallback(() => {
    return shortcuts.map(shortcut => ({
      key: shortcut.key,
      description: shortcut.description,
      modifiers: {
        ctrl: shortcut.ctrlKey,
        alt: shortcut.altKey,
        shift: shortcut.shiftKey,
        meta: shortcut.metaKey
      }
    }));
  }, [shortcuts]);

  return {
    getShortcutsList
  };
}