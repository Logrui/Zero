import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { CommandPaletteProvider } from '@/components/context/command-palette-context';
import { AppBottombar } from '@/components/app-bottombar';

import { Outlet } from 'react-router';


export default function Layout() {
  return (
    <CommandPaletteProvider>
      <HotkeyProviderWrapper>
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
          {/* Globally offset all in-app content above the bottombar */}
          <div className="flex-1 min-h-0 pb-[var(--app-bottombar-height)]">
            <Outlet />
          </div>
          <AppBottombar />
        </div>
      </HotkeyProviderWrapper>
    </CommandPaletteProvider>
  );
}
