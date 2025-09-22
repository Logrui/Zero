import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Button } from './ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// AI Toggle Button Component (props-based)
const AIToggleButton = ({ open, onOpenChange }: Props) => {
  if (open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="dark:bg-sidebar border h-12 w-12 rounded-lg"
            onClick={(e) => {
              if (!open) {
                e.stopPropagation();
                onOpenChange(true);
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
