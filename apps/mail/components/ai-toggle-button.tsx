import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Button } from './ui/button';
import { useAISidebar } from './ui/ai-sidebar';

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// AI Toggle Button Component (props-based)
const AIToggleButton = ({ open, onOpenChange }: Props) => {
  // Fallback to global AI sidebar state if props are not provided
  const { open: hookOpen, setOpen: setHookOpen } = useAISidebar();
  const isOpen = typeof open === 'boolean' ? open : !!hookOpen;
  const handleOpenChange = onOpenChange ?? setHookOpen;

  if (isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="dark:bg-sidebar border h-12 w-12 rounded-lg"
            onClick={(e) => {
              if (!isOpen) {
                e.stopPropagation();
                if (typeof handleOpenChange === 'function') {
                  handleOpenChange(true);
                }
              }
            }}
          >
            <div className="flex items-center justify-center">
              <img
                src="/black-icon.svg"
                alt="AI Assistant"
                width={22}
                height={22}
                className="block dark:hidden"
              />
              <img
                src="/white-icon.svg"
                alt="AI Assistant"
                width={22}
                height={22}
                className="hidden dark:block"
              />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle AI Assistant</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default AIToggleButton;
