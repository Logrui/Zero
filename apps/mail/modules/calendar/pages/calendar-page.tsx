"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiCalendarView } from "../components/multi-calendar-view";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { useMediaQuery } from '@/hooks/use-media-query';
import AISidebar, { useAISidebar } from '@/components/ui/ai-sidebar';

export default function CalendarPage() {
  console.log('CalendarPage: Component is rendering!');

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { open, isSidebar, isFullScreen } = useAISidebar();
  const showRightPanel = !!(isDesktop && open && isSidebar && !isFullScreen);

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex w-full"
        style={{
          height: 'calc(100vh - var(--app-bottombar-height, 4rem))',
        }}
      >
        <ResizablePanel
          id="calendar-main"
          order={1}
          className="min-w-0"
          defaultSize={showRightPanel ? 75 : 100}
          minSize={50}
        >
          <Card className="flex-1 bg-panelLight dark:bg-panelDark border border-[#E7E7E7] shadow-lg dark:border-[#252525] rounded-2xl h-full">
            <CardContent className="h-full p-0">
              <MultiCalendarView initialEvents={[]} initialCategories={[]} />
            </CardContent>
          </Card>
        </ResizablePanel>

        {isDesktop && <ResizableHandle className="hidden md:block" withHandle />}

        {isDesktop && showRightPanel && (
          <ResizablePanel
            id="ai-sidebar"
            order={2}
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className="w-fit"
          >
            <AISidebar asPanelContent />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>

      {/* AI sidebar overlay for popup/fullscreen modes */}
      <AISidebar />
    </div>
  );
}
