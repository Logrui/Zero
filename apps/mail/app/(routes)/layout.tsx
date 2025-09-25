import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { CommandPaletteProvider } from '@/components/context/command-palette-context';
import { AppBottombar } from '@/components/app-bottombar';
import AISidebar, { useAISidebar } from '@/components/ui/ai-sidebar';
import { useLocation } from 'react-router';

import { Outlet } from 'react-router';


export default function Layout() {
  const location = useLocation();
  const { open } = useAISidebar();
  
  // Only render AI sidebar on mail pages to prevent duplicate panels on calendar
  const isMailPage = location.pathname.startsWith('/mail');
  
  return (
    <CommandPaletteProvider>
      <HotkeyProviderWrapper>
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
          {/* Globally offset all in-app content above the bottombar */}
          <div className="flex-1 min-h-0 pb-[var(--app-bottombar-height)]">
            <Outlet />
          </div>
          <AppBottombar />
          
          {/* Global AI sidebar - only render on mail pages */}
          {isMailPage && open && <AISidebar />}
        </div>
      </HotkeyProviderWrapper>
    </CommandPaletteProvider>
  );
}
