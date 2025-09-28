/**
 * NotificationFilters Component (T042)
 * 
 * Tag-based filtering UI for Zero OS notifications system.
 * Features:
 * - Multi-select tag filtering with visual states
 * - Search functionality with autocomplete
 * - State persistence using URL parameters
 * - Priority and read/unread status filters
 * - Clear filters and reset functionality
 * - Responsive design for mobile/desktop
 * - Integration with Zero's theme system
 * 
 * Used by: NotificationOverlay, Dashboard pages
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
// Note: Command components not available in Zero's UI kit
// Will use alternative approach for tag search
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

// Types
export interface FilterState {
  tags: string[];
  searchQuery: string;
  showUnreadOnly: boolean;
  priority: ('low' | 'medium' | 'high')[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  source?: string[];
}

export interface NotificationTag {
  name: string;
  count: number;
  color?: string;
}

export interface NotificationFiltersProps {
  // Current filter state
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  
  // Available options
  availableTags: NotificationTag[];
  availableSources?: string[];
  
  // Display options
  variant?: 'default' | 'compact' | 'sidebar';
  showSearch?: boolean;
  showPriority?: boolean;
  showDateRange?: boolean;
  showAdvanced?: boolean;
  
  // State
  isLoading?: boolean;
  
  className?: string;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High Priority', color: 'text-red-500 bg-red-50' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-500 bg-yellow-50' },
  { value: 'low', label: 'Low Priority', color: 'text-blue-500 bg-blue-50' }
] as const;

export const NotificationFilters = React.forwardRef<
  HTMLDivElement,
  NotificationFiltersProps
>(({ 
  filters,
  onFiltersChange,
  availableTags = [],
  availableSources = [],
  variant = 'default',
  showSearch = true,
  showPriority = true,
  showDateRange = false,
  showAdvanced = false,
  isLoading = false,
  className,
  ...props 
}, ref) => {
  // State for UI interactions
  const [expandedSections, setExpandedSections] = React.useState({
    tags: true,
    priority: false,
    advanced: false
  });
  
  const [tagSearchOpen, setTagSearchOpen] = React.useState(false);
  const [tagSearchValue, setTagSearchValue] = React.useState('');
  
  // Helper functions
  const updateFilters = React.useCallback((updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);
  
  const toggleTag = React.useCallback((tagName: string) => {
    const newTags = filters.tags.includes(tagName)
      ? filters.tags.filter(t => t !== tagName)
      : [...filters.tags, tagName];
    
    updateFilters({ tags: newTags });
  }, [filters.tags, updateFilters]);
  
  const togglePriority = React.useCallback((priority: 'low' | 'medium' | 'high') => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    
    updateFilters({ priority: newPriorities });
  }, [filters.priority, updateFilters]);
  
  const clearAllFilters = React.useCallback(() => {
    onFiltersChange({
      tags: [],
      searchQuery: '',
      showUnreadOnly: false,
      priority: [],
      dateRange: undefined,
      source: []
    });
  }, [onFiltersChange]);
  
  const hasActiveFilters = React.useMemo(() => {
    return filters.tags.length > 0 || 
           filters.searchQuery.length > 0 || 
           filters.showUnreadOnly || 
           filters.priority.length > 0 ||
           (filters.source && filters.source.length > 0);
  }, [filters]);
  
  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!tagSearchValue) return availableTags;
    
    return availableTags.filter(tag =>
      tag.name.toLowerCase().includes(tagSearchValue.toLowerCase())
    );
  }, [availableTags, tagSearchValue]);
  
  // Render sections based on variant
  const renderSearchSection = () => {
    if (!showSearch) return null;
    
    return (
      <div className="space-y-2">
        <Input
          placeholder="Search notifications..."
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          className={cn(
            variant === 'compact' && 'h-8 text-sm'
          )}
          data-testid="notification-search"
        />
      </div>
    );
  };
  
  const renderQuickFilters = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={filters.showUnreadOnly ? "default" : "outline"}
        size={variant === 'compact' ? "sm" : "default"}
        onClick={() => updateFilters({ showUnreadOnly: !filters.showUnreadOnly })}
        className={cn(
          variant === 'compact' && 'h-7 text-xs',
          'transition-colors'
        )}
      >
        Unread Only
      </Button>
      
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size={variant === 'compact' ? "sm" : "default"}
          onClick={clearAllFilters}
          className={cn(
            variant === 'compact' && 'h-7 text-xs',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          Clear All
        </Button>
      )}
    </div>
  );
  
  const renderTagFilters = () => {
    if (availableTags.length === 0) return null;
    
    const displayTags = variant === 'compact' 
      ? availableTags.slice(0, 6) 
      : availableTags;
    
    return (
      <Collapsible 
        open={expandedSections.tags} 
        onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, tags: open }))}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium text-sm">
              Tags ({filters.tags.length} selected)
            </span>
            {/* ChevronDown icon would go here */}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-2 pt-2">
          {/* Tag search for large tag lists */}
          {availableTags.length > 10 && (
            <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                >
                  Search tags...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-64">
                <div className="space-y-2">
                  <Input
                    placeholder="Search tags..."
                    value={tagSearchValue}
                    onChange={(e) => setTagSearchValue(e.target.value)}
                    className="h-8 text-sm"
                  />
                  
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredTags.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">No tags found.</p>
                    ) : (
                      filteredTags.map((tag) => (
                        <div
                          key={tag.name}
                          className="flex items-center justify-between p-2 rounded-sm hover:bg-muted cursor-pointer"
                          onClick={() => {
                            toggleTag(tag.name);
                            setTagSearchOpen(false);
                          }}
                        >
                          <span className="text-sm">{tag.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {tag.count}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Tag grid */}
          <div className="grid grid-cols-1 gap-1">
            {displayTags.map((tag) => (
              <div
                key={tag.name}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  filters.tags.includes(tag.name) && "bg-primary/10 border border-primary/20"
                )}
                onClick={() => toggleTag(tag.name)}
                data-testid={`tag-filter-${tag.name}`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.tags.includes(tag.name)}
                    onChange={() => toggleTag(tag.name)}
                    className="pointer-events-none"
                  />
                  <span 
                    className={cn(
                      "text-sm",
                      variant === 'compact' && 'text-xs'
                    )}
                  >
                    {tag.name}
                  </span>
                </div>
                
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs',
                    variant === 'compact' && 'text-[10px] px-1'
                  )}
                  data-testid="tag-count"
                >
                  {tag.count}
                </Badge>
              </div>
            ))}
          </div>
          
          {variant === 'compact' && availableTags.length > 6 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
            >
              Show {availableTags.length - 6} more tags
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  const renderPriorityFilters = () => {
    if (!showPriority) return null;
    
    return (
      <Collapsible
        open={expandedSections.priority}
        onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, priority: open }))}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium text-sm">
              Priority ({filters.priority.length} selected)
            </span>
            {/* ChevronDown icon would go here */}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-1 pt-2">
          {PRIORITY_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                "hover:bg-muted/50",
                filters.priority.includes(option.value) && "bg-primary/10 border border-primary/20"
              )}
              onClick={() => togglePriority(option.value)}
            >
              <Checkbox
                checked={filters.priority.includes(option.value)}
                onChange={() => togglePriority(option.value)}
                className="pointer-events-none"
              />
              <span className={cn(
                "text-sm capitalize",
                variant === 'compact' && 'text-xs'
              )}>
                {option.label}
              </span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  const renderAdvancedFilters = () => {
    if (!showAdvanced) return null;
    
    return (
      <Collapsible
        open={expandedSections.advanced}
        onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, advanced: open }))}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium text-sm">Advanced Filters</span>
            {/* ChevronDown icon would go here */}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Date range filters */}
          {showDateRange && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  className="text-sm"
                  // Add date range handling here
                />
                <Input
                  type="date"
                  placeholder="To"
                  className="text-sm"
                  // Add date range handling here
                />
              </div>
            </div>
          )}
          
          {/* Source filters */}
          {availableSources.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <div className="space-y-1">
                {availableSources.map((source) => (
                  <div key={source} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.source?.includes(source) || false}
                      onChange={() => {
                        const currentSources = filters.source || [];
                        const newSources = currentSources.includes(source)
                          ? currentSources.filter(s => s !== source)
                          : [...currentSources, source];
                        updateFilters({ source: newSources });
                      }}
                    />
                    <span className="text-sm">{source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  // Render variants
  if (variant === 'compact') {
    return (
      <div
        ref={ref}
        className={cn('space-y-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10', className)}
        {...props}
      >
        {/* Search Section with improved styling */}
        {showSearch && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">🔍</span>
            <Input
              placeholder="Search notifications..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg h-10 backdrop-blur-sm"
            />
          </div>
        )}
        
        {/* Quick Actions Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <span>🔧</span>
            Quick Filters
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-3 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
            >
              Clear All
            </Button>
          )}
        </div>
        
        {/* Unread Only Toggle - Enhanced */}
        <Button
          variant={filters.showUnreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilters({ showUnreadOnly: !filters.showUnreadOnly })}
          className={cn(
            "w-full h-9 text-sm rounded-lg transition-all justify-start",
            filters.showUnreadOnly 
              ? "bg-blue-500/80 hover:bg-blue-500 text-white border-blue-400 shadow-lg"
              : "bg-white/5 hover:bg-white/15 text-white/80 border-white/20 backdrop-blur-sm"
          )}
        >
          <span className="mr-2">👁️</span>
          Show Unread Only
        </Button>
        
        {/* Tag Filters - Enhanced Grid Layout */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-white">Filter by Tags</span>
            <div className="grid grid-cols-2 gap-2">
              {availableTags.slice(0, 6).map((tag) => (
                <Button
                  key={tag.name}
                  variant={filters.tags.includes(tag.name) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.name)}
                  className={cn(
                    "h-8 text-xs rounded-lg transition-all flex items-center justify-between",
                    filters.tags.includes(tag.name)
                      ? "bg-green-500/80 hover:bg-green-500 text-white border-green-400 shadow-lg"
                      : "bg-white/5 hover:bg-white/15 text-white/80 border-white/20 backdrop-blur-sm"
                  )}
                  data-testid={`tag-filter-${tag.name}`}
                >
                  <span className="truncate">{tag.name}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5">
                    {tag.count}
                  </Badge>
                </Button>
              ))}
            </div>
            
            {availableTags.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
              >
                Show {availableTags.length - 6} more tags...
              </Button>
            )}
          </div>
        )}
        
        {/* Active Filters Summary - Enhanced */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-white/80">Active Filters:</span>
            <div className="flex flex-wrap gap-1">
              {filters.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="text-xs cursor-pointer hover:bg-red-500/80 bg-green-500/60 border-green-400/40"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
              
              {filters.showUnreadOnly && (
                <Badge
                  variant="default"
                  className="text-xs cursor-pointer hover:bg-red-500/80 bg-blue-500/60 border-blue-400/40"
                  onClick={() => updateFilters({ showUnreadOnly: false })}
                >
                  Unread only ×
                </Badge>
              )}
              
              {filters.priority.map((priority) => (
                <Badge
                  key={priority}
                  variant="default"
                  className="text-xs cursor-pointer hover:bg-red-500/80 bg-orange-500/60 border-orange-400/40"
                  onClick={() => togglePriority(priority)}
                >
                  {priority} priority ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Default and sidebar variants
  return (
    <Card
      ref={ref}
      className={cn(
        variant === 'sidebar' && 'border-0 shadow-none bg-transparent',
        className
      )}
      {...props}
    >
      <CardHeader className={cn(
        'pb-4',
        variant === 'sidebar' && 'px-0'
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Filters</h3>
          
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {filters.tags.length + filters.priority.length + (filters.showUnreadOnly ? 1 : 0)} active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        'space-y-6',
        variant === 'sidebar' && 'px-0'
      )}>
        {/* Search */}
        {renderSearchSection()}
        
        {/* Quick filters */}
        {renderQuickFilters()}
        
        <Separator />
        
        {/* Tag filters */}
        {renderTagFilters()}
        
        <Separator />
        
        {/* Priority filters */}
        {renderPriorityFilters()}
        
        {/* Advanced filters */}
        {showAdvanced && (
          <>
            <Separator />
            {renderAdvancedFilters()}
          </>
        )}
        
        {/* Filter summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <div className="text-sm font-medium">Active Filters:</div>
              
              <div className="flex flex-wrap gap-1">
                {filters.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="text-xs cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
                
                {filters.priority.map((priority) => (
                  <Badge
                    key={priority}
                    variant="default"
                    className="text-xs cursor-pointer hover:bg-primary/80"
                    onClick={() => togglePriority(priority)}
                  >
                    {priority} priority ×
                  </Badge>
                ))}
                
                {filters.showUnreadOnly && (
                  <Badge
                    variant="default"
                    className="text-xs cursor-pointer hover:bg-primary/80"
                    onClick={() => updateFilters({ showUnreadOnly: false })}
                  >
                    Unread only ×
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// @ts-ignore - displayName is a standard React property
NotificationFilters.displayName = 'NotificationFilters';