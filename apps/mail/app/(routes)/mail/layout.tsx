import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { OnboardingWrapper } from '@/components/onboarding';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Outlet } from 'react-router';

export default function MailLayout() {
  return (
    <HotkeyProviderWrapper>
      <div className="flex w-full h-full overflow-hidden">
        <AppSidebar />
        <div className="bg-sidebar dark:bg-sidebar w-full">
          <Outlet />
        </div>
      </div>
      <OnboardingWrapper />
    </HotkeyProviderWrapper>
  );
}
