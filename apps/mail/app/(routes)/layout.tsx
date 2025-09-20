import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { CommandPaletteProvider } from '@/components/context/command-palette-context';
import { AppTopbar } from '@/components/app-topbar';

import { Outlet } from 'react-router';


export default function Layout() {
  return (
    <CommandPaletteProvider>
      <HotkeyProviderWrapper>
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
          <AppTopbar />
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>
        </div>
      </HotkeyProviderWrapper>
    </CommandPaletteProvider>
  );
}
