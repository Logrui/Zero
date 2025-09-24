import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, Lightning, Mail, ScanEye, Tag, User, X, Search } from '../icons/icons';
import { useCategorySettings, useDefaultCategoryId } from '@/hooks/use-categories';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { useCommandPalette } from '../context/command-palette-context';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';
import { ThreadDisplay } from '@/components/mail/thread-display';
import { useActiveConnection } from '@/hooks/use-connections';
import { Check, ChevronDown, RefreshCcw } from 'lucide-react';
import { useMediaQuery } from '../../hooks/use-media-query';
import useSearchLabels from '@/hooks/use-labels-search';
import * as CustomIcons from '@/components/icons/icons';
import { MailList } from '@/components/mail/mail-list';
import { useNavigate, useParams } from 'react-router';
import { useMail } from '@/components/mail/use-mail';
import { SidebarToggle } from '../ui/sidebar-toggle';
import { clearBulkSelectionAtom } from './use-mail';
import { useEffect, useRef, useState } from 'react';
import AISidebar, { useAISidebar } from '@/components/ui/ai-sidebar';
import { useThreads } from '@/hooks/use-threads';
import AIToggleButton from '../ai-toggle-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { m } from '@/paraglide/messages';
import { isMac } from '@/lib/platform';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';

export function MailLayout() {
  const params = useParams<{ folder: string }>();
  const folder = params?.folder ?? 'inbox';
  const [mail, setMail] = useMail();
  const [, clearBulkSelection] = useAtom(clearBulkSelectionAtom);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const prevFolderRef = useRef(folder);
  const { enableScope, disableScope } = useHotkeysContext();
  const { data: activeConnection } = useActiveConnection();
  const { activeFilters, clearAllFilters } = useCommandPalette();
  const [, setIsCommandPaletteOpen] = useQueryState('isCommandPaletteOpen');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { open: aiOpen, isSidebar: aiIsSidebar, isFullScreen: aiIsFullScreen, setOpen } = useAISidebar();
  const showRightPanel = !!(isDesktop && activeConnection?.id && aiOpen && aiIsSidebar && !aiIsFullScreen);
  
  // (removed debug AI/layout state changes)

  useEffect(() => {
    if (prevFolderRef.current !== folder && mail.bulkSelected.length > 0) {
      clearBulkSelection();
    }
    prevFolderRef.current = folder;
  }, [folder, mail.bulkSelected.length, clearBulkSelection]);

  useEffect(() => {
    if (!session?.user && !isPending) {
      navigate('/login');
    }
  }, [session?.user, isPending]);

  const [{ isFetching, refetch: refetchThreads }] = useThreads();

  const [threadId] = useQueryState('threadId');

  useEffect(() => {
    if (threadId) {
      enableScope('thread-display');
      disableScope('mail-list');
    } else {
      enableScope('mail-list');
      disableScope('thread-display');
    }

    return () => {
      disableScope('thread-display');
      disableScope('mail-list');
    };
  }, [threadId, enableScope, disableScope]);

  //   const handleMailListMouseEnter = useCallback(() => {
  //     enableScope('mail-list');
  //   }, [enableScope]);

  //   const handleMailListMouseLeave = useCallback(() => {
  //     disableScope('mail-list');
  //   }, [disableScope]);

  // Add mailto protocol handler registration
  useEffect(() => {
    // Register as a mailto protocol handler if browser supports it
    if (typeof window !== 'undefined' && 'registerProtocolHandler' in navigator) {
      try {
        // Register the mailto protocol handler
        // When a user clicks a mailto: link, it will be passed to our dedicated handler
        // which will:
        // 1. Parse the mailto URL to extract email, subject and body
        // 2. Create a draft with these values
        // 3. Redirect to the compose page with just the draft ID
        // This ensures we don't keep the email content in the URL
        navigator.registerProtocolHandler('mailto', `/api/mailto-handler?mailto=%s`);
      } catch (error) {
        console.error('Failed to register protocol handler:', error);
      }
    }
  }, []);

  const defaultCategoryId = useDefaultCategoryId();
  const [category] = useQueryState('category', { defaultValue: defaultCategoryId });
  return (
    <TooltipProvider>
      <div className="h-full">
        {isDesktop ? (
          <>
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full"
            >
                <ResizablePanel
                  id="mail-list"
                  order={1}
                  className={cn(
                    'bg-panelLight dark:bg-panelDark mr-0.5 rounded-2xl shadow-sm',
                  )}
                  defaultSize={28}
                  minSize={20}
                >
                  <div className="w-full h-full">
                    <div
                      className={cn(
                        'z-15 flex items-center justify-between gap-1.5 p-2 pb-0 transition-colors',
                      )}
                    >
                      <div className="w-full">
                        <div className="mt-0 grid grid-cols-12 gap-2">
                          <SidebarToggle className="col-span-1 h-fit px-2" />
                          {mail.bulkSelected.length === 0 ? (
                            <div className="col-span-10 flex gap-2">
                              <Button
                                variant="outline"
                                className={cn(
                                  'text-muted-foreground relative flex h-8 w-full select-none items-center justify-start overflow-hidden rounded-lg border bg-white pl-2 text-left text-sm font-normal shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-none dark:bg-background',
                                )}
                                onClick={() => setIsCommandPaletteOpen('true')}
                              >
                                <Search className="fill-[#71717A] dark:fill-[#6F6F6F]" />

                                <span className="hidden truncate pr-20 lg:inline-block">
                                  {activeFilters.length > 0
                                    ? activeFilters.map((f) => f.display).join(', ')
                                    : 'Search'}
                                </span>
                                <span className="inline-block truncate pr-20 lg:hidden">
                                  {activeFilters.length > 0
                                    ? `${activeFilters.length} filter${
                                        activeFilters.length > 1 ? 's' : ''
                                      }`
                                    : 'Search'}
                                </span>

                                <span className="absolute right-[0rem] flex items-center gap-1">
                                  {activeFilters.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="my-auto h-5 rounded-xl px-1.5 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearAllFilters();
                                      }}
                                    >
                                      Clear
                                    </Button>
                                  )}
                                  <kbd className="bg-muted text-md leading-[0]! pointer-events-none mr-0.5 hidden h-7 select-none flex-row items-center gap-1 rounded-md border-none px-2 font-medium opacity-100 sm:flex dark:bg-muted dark:text-muted-foreground">
                                    <span
                                      className={cn(
                                        'leading-[0.2]! h-min',
                                        isMac ? 'mt-px text-lg' : 'text-sm',
                                      )}
                                    >
                                      {isMac ? '⌘' : 'Ctrl'}{' '}
                                    </span>
                                    <span className="leading-[0.2]! h-min text-sm"> K</span>
                                  </kbd>
                                </span>
                              </Button>
                              {activeConnection?.providerId === 'google' && folder === 'inbox' && (
                                <CategoryDropdown isMultiSelectMode={mail.bulkSelected.length > 0} />
                              )}
                            </div>
                          ) : null}
                          <Button
                            onClick={() => {
                              refetchThreads();
                            }}
                            variant="ghost"
                            className="md:h-fit md:px-2"
                          >
                            <RefreshCcw className="text-muted-foreground h-4 w-4 cursor-pointer" />
                          </Button>
                          {mail.bulkSelected.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => {
                                      setMail({ ...mail, bulkSelected: [] });
                                    }}
                                    className="flex h-6 items-center gap-1 rounded-md bg-muted px-2 text-xs text-muted-foreground hover:bg-muted/80"
                                  >
                                    <X className="h-3 w-3 fill-[#A0A0A0]" />
                                    <span>esc</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {m['common.actions.exitSelectionModeEsc']()}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        `${category === 'Important' ? 'bg-[#F59E0D]' : category === 'All Mail' ? 'bg-[#006FFE]' : category === 'Personal' ? 'bg-[#39ae4a]' : category === 'Updates' ? 'bg-[#8B5CF6]' : category === 'Promotions' ? 'bg-[#F43F5E]' : category === 'Unread' ? 'bg-[#FF4800]' : 'bg-[#F59E0D]'} `,
                        'z-5 relative h-0.5 w-full transition-opacity',
                        isFetching ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="z-1 relative h-full overflow-hidden pt-0 md:h-full">
                      <MailList />
                    </div>
                  </div>
                </ResizablePanel>

                {isDesktop && <ResizableHandle className="mr-0.5 hidden md:block" withHandle />}

                {isDesktop && (
                  <ResizablePanel
                    id="thread-display"
                    order={2}
                    className={cn(
                      'bg-panelLight dark:bg-panelDark mr-0.5 w-full rounded-2xl shadow-sm',
                    )}
                      defaultSize={showRightPanel ? 50 : 72}
                    minSize={20}
                  >
                    <div className="relative w-full h-full">
                      <ThreadDisplay />
                    </div>
                  </ResizablePanel>
                )}

                {/* Right handle and AI sidebar panel - render only when AI is open in sidebar mode */}
                {isDesktop && !!activeConnection?.id && aiOpen && aiIsSidebar && !aiIsFullScreen && (
                  <>
                    <ResizableHandle className="mr-0.5 hidden md:block" withHandle />
                    <ResizablePanel
                      id="ai-sidebar"
                      order={3}
                      defaultSize={22}
                      minSize={16}
                      maxSize={40}
                      className={cn('w-fit rounded-2xl')}
                        >
                      <AISidebar asPanelContent />
                    </ResizablePanel>
                  </>
                )}

                {/* Mobile Thread View */}
                {isMobile && threadId && (
                  <div className="bg-panelLight dark:bg-panelDark fixed inset-0 z-50">
                    <div className="flex h-full flex-col">
                      <div className="h-full overflow-y-auto outline-none">
                        <ThreadDisplay />
                      </div>
                    </div>
                  </div>
                )}

                {activeConnection?.id ? (
                  <AIToggleButton open={aiOpen} onOpenChange={setOpen} />
                ) : null}
              </ResizablePanelGroup>
              {/* Overlay instance for popup/fullscreen modes */}
              <AISidebar />
            </>
          ) : (
            <MailList />
          )}
      </div>
    </TooltipProvider>
  );
}

export const Categories = () => {
  const defaultCategoryIdInner = useDefaultCategoryId();
  const categorySettings = useCategorySettings();
  const [activeCategory] = useQueryState('category', {
    defaultValue: defaultCategoryIdInner,
  });

  const categories = categorySettings.map((cat) => {
    const base = {
      id: cat.id,
      name: (() => {
        const key = `common.mailCategories.${cat.id
          .split(' ')
          .map((w, i) => (i === 0 ? w.toLowerCase() : w))
          .join('')}` as keyof typeof m;
        return m[key] && typeof m[key] === 'function' ? (m[key] as () => string)() : cat.name;
      })(),
      searchValue: cat.searchValue,
    } as const;

    // Helper to decide fill colour depending on selection
    const isSelected = activeCategory === cat.id;
    if (cat.icon && cat.icon in CustomIcons) {
      const DynamicIcon = CustomIcons[cat.icon as keyof typeof CustomIcons];
      return {
        ...base,
        icon: (
          <DynamicIcon
            className={cn(
              'fill-muted-foreground h-4 w-4 dark:fill-white',
              isSelected && 'fill-white',
            )}
          />
        ),
      };
    }

    switch (cat.id) {
      case 'Important':
        return {
          ...base,
          icon: (
            <Lightning
              className={cn('fill-muted-foreground dark:fill-white', isSelected && 'fill-white')}
            />
          ),
        };
      case 'All Mail':
        return {
          ...base,
          icon: (
            <Mail
              className={cn('fill-muted-foreground dark:fill-white', isSelected && 'fill-white')}
            />
          ),
          colors:
            'border-0 bg-[#006FFE] text-white dark:bg-[#006FFE] dark:text-white dark:hover:bg-[#006FFE]/90',
        };
      case 'Personal':
        return {
          ...base,
          icon: (
            <User
              className={cn('fill-muted-foreground dark:fill-white', isSelected && 'fill-white')}
            />
          ),
        };
      case 'Promotions':
        return {
          ...base,
          icon: (
            <Tag
              className={cn('fill-muted-foreground dark:fill-white', isSelected && 'fill-white')}
            />
          ),
        };
      case 'Updates':
        return {
          ...base,
          icon: (
            <Bell
              className={cn('fill-muted-foreground dark:fill-white', isSelected && 'fill-white')}
            />
          ),
        };
      case 'Unread':
        return {
          ...base,
          icon: (
            <ScanEye
              className={cn(
                'fill-muted-foreground h-4 w-4 dark:fill-white',
                isSelected && 'fill-white',
              )}
            />
          ),
        };
      default:
        return base as any;
    }
  });

  return categories;
};
interface CategoryDropdownProps {
  isMultiSelectMode?: boolean;
}

function CategoryDropdown({ isMultiSelectMode }: CategoryDropdownProps) {
  const categorySettings = useCategorySettings();
  const { setLabels, labels } = useSearchLabels();
  const params = useParams<{ folder: string }>();
  const folder = params?.folder ?? 'inbox';
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    (key) => {
      const category = categorySettings[Number(key.key) - 1];
      if (!category) return;
      const isCurrentlyActive = labels.includes(category.searchValue);

      if (isCurrentlyActive) {
        setLabels(labels.filter((label) => label !== category.searchValue));
      } else {
        setLabels([...labels, category.searchValue]);
      }
    },
    {
      scopes: ['mail-list'],
      preventDefault: true,
      enableOnFormTags: false,
    },
  );

  const handleLabelChange = (searchValue: string) => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      setLabels([]);
      return;
    }

    const parsedLabels = trimmed
      .split(',')
      .map((label) => label.trim())
      .filter((label) => label.length > 0);

    if (parsedLabels.length === 0) {
      setLabels([]);
      return;
    }

    const currentLabelsSet = new Set(labels);
    const parsedLabelsSet = new Set(parsedLabels);

    const allLabelsSelected = parsedLabels.every((label) => currentLabelsSet.has(label));

    if (allLabelsSelected) {
      const updatedLabels = labels.filter((label) => !parsedLabelsSet.has(label));
      setLabels(updatedLabels);
    } else {
      const newLabelsSet = new Set([...labels, ...parsedLabels]);
      setLabels(Array.from(newLabelsSet));
    }
  };

  if (folder !== 'inbox' || isMultiSelectMode) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'black:text-white text-muted-foreground flex h-8 min-w-fit items-center gap-1 rounded-md border-none px-2',
          )}
          aria-label="Filter by labels"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <span className="text-xs font-medium">
            {labels.length > 0
              ? `${labels.length} View${labels.length > 1 ? 's' : ''}`
              : m['navigation.settings.categories']()}
          </span>
          <ChevronDown
            className={`black:text-white text-muted-foreground h-2 w-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-muted w-48 font-medium dark:bg-[#2C2C2C]"
        align="start"
        role="menu"
        aria-label="Label filter options"
      >
        {categorySettings.map((category) => (
          <DropdownMenuItem
            key={category.id}
            className="flex cursor-pointer items-center gap-2 hover:bg-white/10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLabelChange(category.searchValue);
            }}
            role="menuitemcheckbox"
            aria-checked={labels.includes(category.id)}
          >
            <span className="text-muted-foreground capitalize">{category.name.toLowerCase()}</span>
            {/* Special case: empty searchValue means "All Mail" - shows everything */}
            {(category.searchValue === ''
              ? labels.length === 0
              : category.searchValue.split(',').some((val) => labels.includes(val))) && (
              <Check className="ml-auto h-3 w-3" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
