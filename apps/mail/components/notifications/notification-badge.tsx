import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  /** Number of unread notifications */
  count: number;
  /** Maximum number to display before showing "99+" */
  maxCount?: number;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show badge even when count is 0 */
  showZero?: boolean;
  /** Animation when count changes */
  animated?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * NotificationBadge Component
 * 
 * A badge component that displays the count of unread notifications
 * with proper accessibility and visual feedback.
 * 
 * Features:
 * - Responsive sizing
 * - Count truncation (99+)
 * - Animation support
 * - Accessibility attributes
 * - Click handling
 */
export function NotificationBadge({
  count,
  maxCount = 99,
  className,
  size = 'md',
  showZero = false,
  animated = true,
  onClick
}: NotificationBadgeProps) {
  const [prevCount, setPrevCount] = React.useState(count);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Trigger animation when count changes
  React.useEffect(() => {
    if (animated && count !== prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
  }, [count, prevCount, animated]);

  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[18px] h-[18px]',
    md: 'text-xs px-2 py-0.5 min-w-[20px] h-[20px]',
    lg: 'text-sm px-2.5 py-1 min-w-[24px] h-[24px]'
  };

  return (
    <Badge
      variant={count === 0 ? 'secondary' : 'destructive'}
      className={cn(
        'rounded-full font-medium flex items-center justify-center',
        'transition-all duration-200',
        sizeClasses[size],
        animated && isAnimating && 'animate-pulse scale-110',
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
      onClick={onClick}
      role="status"
      aria-label={`${count} unread notification${count === 1 ? '' : 's'}`}
      title={`${count} unread notification${count === 1 ? '' : 's'}`}
    >
      {displayCount}
    </Badge>
  );
}

/**
 * Hook for managing notification badge state
 */
export function useNotificationBadge(initialCount = 0) {
  const [count, setCount] = React.useState(initialCount);
  
  const increment = React.useCallback((amount = 1) => {
    setCount(prev => prev + amount);
  }, []);
  
  const decrement = React.useCallback((amount = 1) => {
    setCount(prev => Math.max(0, prev - amount));
  }, []);
  
  const reset = React.useCallback(() => {
    setCount(0);
  }, []);
  
  const set = React.useCallback((newCount: number) => {
    setCount(Math.max(0, newCount));
  }, []);
  
  return {
    count,
    increment,
    decrement,
    reset,
    set
  };
}

/**
 * NotificationIcon Component
 * 
 * Combines a notification icon with the badge for use in navigation bars
 */
interface NotificationIconProps {
  /** Number of unread notifications */
  count: number;
  /** Size of the icon and badge */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom icon (defaults to bell emoji) */
  icon?: React.ReactNode;
}

export function NotificationIcon({
  count,
  size = 'md',
  className,
  onClick,
  icon
}: NotificationIconProps) {
  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg', 
    lg: 'text-xl'
  };

  return (
    <div 
      className={cn(
        'relative inline-block',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label="Notifications"
    >
      {/* Icon */}
      <div className={cn('flex items-center justify-center', iconSizes[size])}>
        {icon || (
          <svg 
            className="h-5 w-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            />
          </svg>
        )}
      </div>
      
      {/* Badge */}
      {count > 0 && (
        <div className="absolute -top-1 -right-1">
          <NotificationBadge 
            count={count} 
            size="sm"
            animated={true}
          />
        </div>
      )}
    </div>
  );
}

export default NotificationBadge;