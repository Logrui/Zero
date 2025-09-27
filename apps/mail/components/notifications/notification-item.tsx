/**
 * NotificationItem Component (T041)
 * 
 * Individual notification display component for Zero OS notifications system.
 * Features:
 * - Expandable content with smooth animations
 * - Action buttons (delete, mark as read, etc.)
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Priority indicators and visual states
 * - Responsive design for mobile/desktop
 * - Theme integration with Zero's design system
 * 
 * Used by: NotificationOverlay, Dashboard, Individual pages
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Trash2, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Calendar,
  Tag as TagIcon,
  User as UserIcon,
  AlertCircle,
  Info,
  AlertTriangle,
  Clock
} from 'lucide-react';

// Types
export interface NotificationItemData {
  id: string;
  subject: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high';
  source?: string;
  metadata?: {
    sender?: string;
    category?: string;
    externalId?: string;
  };
}

export interface NotificationItemProps {
  notification: NotificationItemData;
  isSelected?: boolean;
  isFocused?: boolean;
  showCheckbox?: boolean;
  isExpanded?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  
  // Event handlers
  onClick?: (notification: NotificationItemData) => void;
  onDelete?: (notificationId: string) => void;
  onToggleRead?: (notificationId: string) => void;
  onToggleSelection?: (notificationId: string) => void;
  onExpand?: (notificationId: string, expanded: boolean) => void;
  
  className?: string;
}

// Priority configurations
const PRIORITY_CONFIG = {
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  high: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  }
} as const;

export const NotificationItem = React.forwardRef<
  HTMLDivElement,
  NotificationItemProps
>(({ 
  notification,
  isSelected = false,
  isFocused = false,
  showCheckbox = false,
  isExpanded: controlledExpanded,
  variant = 'default',
  onClick,
  onDelete,
  onToggleRead,
  onToggleSelection,
  onExpand,
  className,
  ...props 
}, ref) => {
  // Internal state for expansion when not controlled
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  
  // Refs for accessibility
  const itemRef = React.useRef<HTMLDivElement>(null);
  
  // Priority configuration
  const priorityConfig = notification.priority ? PRIORITY_CONFIG[notification.priority] : null;
  const PriorityIcon = priorityConfig?.icon;
  
  // Handle expansion toggle
  const handleExpansionToggle = React.useCallback(() => {
    const newExpanded = !isExpanded;
    
    if (onExpand) {
      onExpand(notification.id, newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  }, [isExpanded, onExpand, notification.id]);
  
  // Handle keyboard events
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (event.shiftKey) {
          handleExpansionToggle();
        } else if (onClick) {
          onClick(notification);
        }
        break;
        
      case 'Delete':
        event.preventDefault();
        if (onDelete) {
          onDelete(notification.id);
        }
        break;
        
      case 'r':
      case 'R':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (onToggleRead) {
            onToggleRead(notification.id);
          }
        }
        break;
    }
  }, [onClick, onDelete, onToggleRead, notification, handleExpansionToggle]);
  
  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Truncate body text for compact display
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Determine card styling based on state
  const cardStyles = cn(
    'transition-all duration-200 ease-in-out cursor-pointer',
    'hover:shadow-md hover:bg-muted/30',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    
    // Selection state
    isSelected && 'bg-primary/10 border-primary shadow-sm',
    
    // Focus state
    isFocused && 'ring-2 ring-ring ring-offset-2',
    
    // Read/unread state
    !notification.isRead && 'border-l-4 border-l-primary bg-background',
    notification.isRead && 'opacity-75 hover:opacity-100',
    
    // Priority styling
    priorityConfig && !notification.isRead && [
      priorityConfig.borderColor,
      'border-l-4'
    ],
    
    // Variant styling
    variant === 'compact' && 'hover:scale-[1.01]',
    variant === 'detailed' && 'shadow-md',
    
    className
  );
  
  // Common content sections
  const renderMetadata = () => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {notification.source && (
        <div className="flex items-center gap-1">
          <UserIcon className="h-3 w-3" />
          <span>{notification.source}</span>
        </div>
      )}
      
      {notification.metadata?.sender && (
        <div className="flex items-center gap-1">
          <UserIcon className="h-3 w-3" />
          <span>{notification.metadata.sender}</span>
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>{formatDate(notification.createdAt)}</span>
      </div>
      
      {notification.metadata?.category && (
        <div className="flex items-center gap-1">
          <TagIcon className="h-3 w-3" />
          <span>{notification.metadata.category}</span>
        </div>
      )}
    </div>
  );
  
  const renderTags = () => (
    <div className="flex items-center gap-1 flex-wrap">
      {notification.tags.slice(0, variant === 'compact' ? 2 : 4).map((tag) => (
        <Badge 
          key={tag} 
          variant="secondary" 
          className={cn(
            'text-xs',
            variant === 'compact' && 'px-1.5 py-0.5 text-[10px]'
          )}
        >
          {tag}
        </Badge>
      ))}
      
      {notification.tags.length > (variant === 'compact' ? 2 : 4) && (
        <Badge variant="outline" className="text-xs">
          +{notification.tags.length - (variant === 'compact' ? 2 : 4)}
        </Badge>
      )}
    </div>
  );
  
  const renderActionButtons = () => (
    <div className="flex items-center gap-1">
      {/* Mark as read/unread */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggleRead?.(notification.id);
        }}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
      >
        {notification.isRead ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
      
      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(notification.id);
        }}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
        title="Delete notification"
        data-testid="delete-notification"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      {/* More actions */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
  
  // Render variants
  if (variant === 'compact') {
    return (
      <Card
        ref={ref}
        className={cardStyles}
        onClick={() => onClick?.(notification)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Notification: ${notification.subject}`}
        data-testid="notification-item"
        {...props}
      >
        <CardHeader className="p-3 group">
          <div className="flex items-center gap-3">
            {/* Checkbox for bulk selection */}
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleSelection?.(notification.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select notification"
                data-testid="notification-checkbox"
              />
            )}
            
            {/* Priority indicator */}
            {priorityConfig && PriorityIcon && (
              <div className={cn('flex-shrink-0', priorityConfig.color)}>
                <PriorityIcon className="h-4 w-4" />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle 
                  className="text-sm font-medium truncate"
                  data-testid="notification-subject"
                >
                  {notification.subject}
                </CardTitle>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-muted-foreground truncate mb-1">
                {truncateText(notification.body, 80)}
              </p>
              
              <div className="flex items-center justify-between">
                {renderTags()}
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            {renderActionButtons()}
          </div>
        </CardHeader>
      </Card>
    );
  }
  
  // Default and detailed variants
  return (
    <Card
      ref={ref}
      className={cardStyles}
      onClick={() => onClick?.(notification)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Notification: ${notification.subject}`}
      data-testid="notification-item"
      {...props}
    >
      <CardHeader className="pb-2 group">
        <div className="flex items-start gap-3">
          {/* Checkbox for bulk selection */}
          {showCheckbox && (
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelection?.(notification.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
              aria-label="Select notification"
              data-testid="notification-checkbox"
            />
          )}
          
          {/* Priority indicator */}
          {priorityConfig && PriorityIcon && (
            <div className={cn(
              'flex-shrink-0 p-1.5 rounded-full mt-0.5',
              priorityConfig.color,
              priorityConfig.bgColor
            )}>
              <PriorityIcon className="h-4 w-4" />
            </div>
          )}
          
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title and status */}
            <div className="flex items-center gap-2 mb-1">
              <CardTitle 
                className="text-base font-medium"
                data-testid="notification-subject"
              >
                {notification.subject}
              </CardTitle>
              
              {!notification.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              )}
            </div>
            
            {/* Body preview */}
            <p className="text-sm text-muted-foreground mb-3">
              {isExpanded ? notification.body : truncateText(notification.body, 150)}
            </p>
            
            {/* Expandable content */}
            {notification.body.length > 150 && (
              <Collapsible open={isExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExpansionToggle();
                    }}
                    className="h-6 px-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        Show less <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  {variant === 'detailed' && (
                    <div className="mt-3 pt-3 border-t">
                      {/* Extended metadata for detailed view */}
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {notification.metadata?.externalId && (
                          <div>
                            <span className="font-medium">External ID:</span> {notification.metadata.externalId}
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium">Created:</span> {new Date(notification.createdAt).toLocaleString()}
                        </div>
                        
                        {notification.updatedAt !== notification.createdAt && (
                          <div>
                            <span className="font-medium">Updated:</span> {new Date(notification.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
            
            <Separator className="my-3" />
            
            {/* Footer with tags and metadata */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {renderTags()}
              </div>
              
              <div className="flex items-center gap-3">
                {renderMetadata()}
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          {renderActionButtons()}
        </div>
      </CardHeader>
    </Card>
  );
});

NotificationItem.displayName = 'NotificationItem';