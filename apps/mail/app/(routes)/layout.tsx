import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { CommandPaletteProvider } from '@/components/context/command-palette-context';
import { AppTopbar } from '@/components/app-topbar';

import { Outlet } from 'react-router';


export default function Layout() {
  return (
    <CommandPaletteProvider>
      <HotkeyProviderWrapper>
        <div className="h-screen flex flex-col">
          <AppTopbar />
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </HotkeyProviderWrapper>
    </CommandPaletteProvider>
  );
}
