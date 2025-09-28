/**
 * NotificationOverlay Component (T040)
 * 
 * A responsive overlay component for displaying notifications in Zero OS.
 * Features:
 * - Responsive design that works on mobile and desktop
 * - Keyboard navigation support (Arrow keys, Enter, Escape)
 * - Scroll management with proper focus handling
 * - Theme integration with Zero's design system
 * - Accessibility features (ARIA labels, focus management)
 * - Notification filtering and search capabilities
 * - Bulk selection and management
 * 
 * Integration: Uses Zero's UI components (Dialog, Card, Button, etc.)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  MoreHorizontal, 
  CheckSquare, 
  Square,
  ArrowUp,
  ArrowDown,
  X,
  Settings
} from 'lucide-react';

// Types
export interface Notification {
  id: string;
  subject: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high';
  source?: string;
}

export interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onNotificationDelete: (notificationIds: string[]) => Promise<void>;
  onMarkAsRead: (notificationIds: string[]) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// Filter and search context
interface FilterState {
  tags: string[];
  searchQuery: string;
  showUnreadOnly: boolean;
  priority: string[];
}

export const NotificationOverlay = React.forwardRef<
  HTMLDivElement,
  NotificationOverlayProps
>(({ 
  isOpen, 
  onClose, 
  notifications, 
  onNotificationClick,
  onNotificationDelete,
  onMarkAsRead,
  isLoading = false,
  error = null,
  className,
  ...props 
}, ref) => {
  // State management
  const [filters, setFilters] = React.useState<FilterState>({
    tags: [],
    searchQuery: '',
    showUnreadOnly: false,
    priority: []
  });
  
  const [selectedNotifications, setSelectedNotifications] = React.useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
  
  // Refs for scroll and focus management
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const notificationRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  
  // Filter notifications based on current filters
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(notification => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          notification.subject.toLowerCase().includes(query) ||
          notification.body.toLowerCase().includes(query) ||
          notification.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }
      
      // Tag filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          notification.tags.includes(filterTag)
        );
        if (!hasMatchingTag) return false;
      }
      
      // Unread filter
      if (filters.showUnreadOnly && notification.isRead) {
        return false;
      }
      
      // Priority filter
      if (filters.priority.length > 0 && notification.priority) {
        if (!filters.priority.includes(notification.priority)) {
          return false;
        }
      }
      
      return true;
    });
  }, [notifications, filters]);
  
  // Get unique tags for filtering
  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    notifications.forEach(notification => {
      notification.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notifications]);
  
  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            Math.min(prev + 1, filteredNotifications.length - 1)
          );
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
          
        case 'Enter':
          event.preventDefault();
          if (filteredNotifications[focusedIndex]) {
            onNotificationClick(filteredNotifications[focusedIndex]);
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          if (isBulkMode) {
            setIsBulkMode(false);
            setSelectedNotifications([]);
          } else {
            onClose();
          }
          break;
          
        case 'Delete':
          event.preventDefault();
          if (selectedNotifications.length > 0) {
            handleBulkDelete();
          } else if (filteredNotifications[focusedIndex]) {
            handleSingleDelete(filteredNotifications[focusedIndex].id);
          }
          break;
          
        case ' ':
          event.preventDefault();
          if (isBulkMode && filteredNotifications[focusedIndex]) {
            toggleNotificationSelection(filteredNotifications[focusedIndex].id);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, filteredNotifications, isBulkMode, selectedNotifications]);
  
  // Auto-scroll focused notification into view
  React.useEffect(() => {
    const focusedElement = notificationRefs.current[focusedIndex];
    if (focusedElement && scrollAreaRef.current) {
      focusedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [focusedIndex]);
  
  // Reset state when overlay opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setSelectedNotifications([]);
      setIsBulkMode(false);
    }
  }, [isOpen]);
  
  // Handler functions
  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    setFocusedIndex(0); // Reset focus when search changes
  };
  
  const toggleTagFilter = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    setFocusedIndex(0);
  };
  
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };
  
  const selectAllNotifications = () => {
    setSelectedNotifications(filteredNotifications.map(n => n.id));
  };
  
  const clearSelection = () => {
    setSelectedNotifications([]);
  };
  
  const handleSingleDelete = async (notificationId: string) => {
    try {
      await onNotificationDelete([notificationId]);
      toast.success('Notification deleted successfully');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await onNotificationDelete(selectedNotifications);
      toast.success(`${selectedNotifications.length} notifications deleted successfully`);
      setSelectedNotifications([]);
      setIsBulkMode(false);
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };
  
  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await onMarkAsRead(selectedNotifications);
      toast.success(`${selectedNotifications.length} notifications marked as read`);
      setSelectedNotifications([]);
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };
  
  // Component render
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        showOverlay={true} // Enable backdrop blur effect
        className={cn(
          // Right-center positioned overlay with half screen dimensions and padding
          'fixed right-4 top-1/2 -translate-y-1/2 w-[50vw] h-[50vh] flex flex-col p-0 gap-0 m-0',
          'sm:w-[90vw] sm:h-[70vh] sm:right-2', // Mobile responsive - larger on mobile
          'border border-white/10 rounded-lg shadow-2xl bg-[#111111]/95 backdrop-blur-sm',
          className
        )}
        ref={ref}
        {...props}
        aria-label="Notifications overlay"
        data-testid="notification-overlay"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-white/10 bg-[#1E1E1E]/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-white font-bold">
              <Bell className="h-5 w-5" />
              Notifications
              {filteredNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredNotifications.length}
                </Badge>
              )}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {/* Bulk mode toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedNotifications([]);
                }}
                data-testid="bulk-select-mode"
              >
                {isBulkMode ? (
                  <>
                    <X className="h-4 w-4" />
                    Exit Bulk
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Bulk Select
                  </>
                )}
              </Button>
              
              {/* Settings */}
              <Button asChild variant="outline" size="sm">
                <Link to="/notifications/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              
              {/* Close button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                aria-label="Close notifications"
                data-testid="close-notifications"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 pt-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search notifications..."
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                data-testid="notification-search"
              />
            </div>
            
            {/* Tag filters */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Filters:</span>
                {availableTags.slice(0, 8).map((tag) => (
                  <Button
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTagFilter(tag)}
                    className="h-6 text-xs"
                    data-testid={`tag-filter-${tag}`}
                  >
                    {tag}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {notifications.filter(n => n.tags.includes(tag)).length}
                    </Badge>
                  </Button>
                ))}
                
                {/* Show unread only toggle */}
                <Button
                  variant={filters.showUnreadOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    showUnreadOnly: !prev.showUnreadOnly 
                  }))}
                  className="h-6 text-xs"
                >
                  Unread Only
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        {/* Bulk actions toolbar */}
        {isBulkMode && (
          <div className="flex items-center justify-between px-6 py-3 bg-muted/50 border-b" data-testid="bulk-selection-toolbar">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium" data-testid="selection-count">
                {selectedNotifications.length} selected
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllNotifications}
                  data-testid="select-all-notifications"
                >
                  Select All
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  data-testid="clear-selection"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkAsRead}
                disabled={selectedNotifications.length === 0}
              >
                Mark as Read
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedNotifications.length === 0}
                data-testid="bulk-delete-selected"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
        
        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-destructive mb-2">Failed to load notifications</p>
                <p className="text-sm text-white/70">{error}</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bell className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2 text-white">No notifications found</p>
                <p className="text-sm text-white/60">
                  {filters.searchQuery || filters.tags.length > 0 
                    ? 'Try adjusting your filters'
                    : 'You\'re all caught up!'
                  }
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-4 space-y-2 bg-[#0F0F0F]/30">
                {filteredNotifications.map((notification, index) => (
                  <Card
                    key={notification.id}
                    ref={(el) => { notificationRefs.current[index] = el; }}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:bg-white/5 border-white/10',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                      focusedIndex === index && 'ring-2 ring-white/20',
                      !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-500/5',
                      selectedNotifications.includes(notification.id) && 'bg-blue-500/10 border-blue-500/30',
                      'bg-[#1A1A1A]/50 backdrop-blur-sm'
                    )}
                    onClick={() => {
                      if (isBulkMode) {
                        toggleNotificationSelection(notification.id);
                      } else {
                        onNotificationClick(notification);
                      }
                    }}
                    tabIndex={0}
                    data-testid="notification-item"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Bulk mode checkbox */}
                          {isBulkMode && (
                            <Checkbox
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={() => toggleNotificationSelection(notification.id)}
                              className="mt-1"
                              data-testid="notification-checkbox"
                            />
                          )}
                          
                          {/* Notification content */}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium mb-1 truncate text-white" data-testid="notification-subject">
                              {notification.subject}
                            </CardTitle>
                            
                            <p className="text-sm text-white/70 line-clamp-2 mb-2">
                              {notification.body}
                            </p>
                            
                            {/* Tags and metadata */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {notification.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              
                              {notification.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{notification.tags.length - 3} more
                                </Badge>
                              )}
                              
                              <span className="text-xs text-white/50 ml-auto">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        {!isBulkMode && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSingleDelete(notification.id);
                              }}
                              className="h-8 w-8 p-0"
                              data-testid="delete-notification"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* Footer with statistics */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span data-testid="total-notification-count">
              {filteredNotifications.length} of {notifications.length} notifications
            </span>
            
            <div className="flex items-center gap-4">
              <span>
                Unread: {notifications.filter(n => !n.isRead).length}
              </span>
              
              {selectedNotifications.length > 0 && (
                <span className="font-medium">
                  {selectedNotifications.length} selected
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

NotificationOverlay.displayName = 'NotificationOverlay';

