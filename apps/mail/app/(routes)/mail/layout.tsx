import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { OnboardingWrapper } from '@/components/onboarding';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Outlet } from 'react-router';

export default function MailLayout() {
  return (
    <HotkeyProviderWrapper>
      <div className="flex h-full">
        <AppSidebar />
        <div className="bg-sidebar dark:bg-sidebar flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
      <OnboardingWrapper />
    </HotkeyProviderWrapper>
  );
}
