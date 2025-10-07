import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputField = activeElement?.tagName === 'INPUT' || 
                          activeElement?.tagName === 'TEXTAREA' ||
                          activeElement?.getAttribute('contenteditable') === 'true';

      // Don't trigger shortcuts when typing in input fields (except for specific keys like Escape)
      if (isInputField && event.key !== 'Escape') {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export function getKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]): string {
  return shortcuts
    .map(s => {
      const keys = [];
      if (s.ctrl) keys.push('Ctrl');
      if (s.shift) keys.push('Shift');
      if (s.alt) keys.push('Alt');
      keys.push(s.key.toUpperCase());
      return `${keys.join('+')} - ${s.description}`;
    })
    .join('\n');
}
