/**
 * Notifications Dashboard Page (T044)
 * 
  const [filters, setFilters] = useState({
    tags: [] as string[],
    searchQuery: '',
    showUnreadOnly: false,
    priority: [] as string[],
  });n notifications dashboard integrating overlay, filters, and management components.
 */

import * as React from 'react';
import { Link } from 'react-router';

import { NotificationFilters } from '@/components/notifications/notification-filters';
import { ApiKeyManager } from '@/components/notifications/api-key-manager';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Key, Bell, Trash2, Eye, X, ThumbsUp, ThumbsDown, RotateCcw, Check, RefreshCw } from 'lucide-react';

// Note: Metadata export removed due to missing Next.js types

// Notification type
type Notification = {
  id: string;
  subject: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  readStatus?: boolean;
  priority: 'low' | 'medium' | 'high';
};

export default function NotificationsPage() {
  const [filters, setFilters] = React.useState({
    tags: [] as string[],
    searchQuery: '',
    showUnreadOnly: false,
    priority: [] as ('medium' | 'low' | 'high')[]
  });

  const [selectedTab, setSelectedTab] = React.useState('notifications');
  const [apiKeys, setApiKeys] = React.useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false);
  const [notificationView, setNotificationView] = React.useState<'unread' | 'read'>('unread');
  const [selectedNotifications, setSelectedNotifications] = React.useState<string[]>([]);
  const [detailNotification, setDetailNotification] = React.useState<Notification | null>(null);

  const availableTags = React.useMemo(() => {
    const tagMap = new Map<string, number>();
    notifications.forEach(notification => {
      notification.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
  }, [notifications]);

  const isLoadingRef = React.useRef(false);

  const loadNotifications = React.useCallback(async () => {
    if (isLoadingRef.current) return; // Prevent multiple simultaneous requests
    isLoadingRef.current = true;
    setIsLoadingNotifications(true);
    
    const startTime = Date.now();
    const minLoadingDuration = 1600; // Minimum 1600ms to show animation
    
    try {
      const response = await fetch('http://localhost:8787/notifications/api?userId=test-user-123');
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      // Ensure loading state shows for at least minLoadingDuration
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingDuration - elapsed);
      
      setTimeout(() => {
        setIsLoadingNotifications(false);
        isLoadingRef.current = false;
      }, remainingTime);
    }
  }, []);

  const loadApiKeys = React.useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const response = await fetch('http://localhost:8787/notifications/api/keys');
      const result = await response.json();
      if (result.success) {
        setApiKeys(result.data);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  // Load notifications on mount and refresh every 30 seconds for real-time updates
  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Load API keys when switching to API keys tab
  React.useEffect(() => {
    if (selectedTab === 'api-keys' && apiKeys.length === 0) {
      loadApiKeys();
    }
  }, [selectedTab, apiKeys.length, loadApiKeys]);

  const handleNotificationClick = React.useCallback((notification: Notification) => {
    setDetailNotification(notification);
  }, []);

  const handleNotificationDelete = React.useCallback(async (notificationIds: string[]) => {
    try {
      await Promise.all(
        notificationIds.map(id =>
          fetch(`http://localhost:8787/notifications/api/${id}`, {
            method: 'DELETE',
          })
        )
      );
      // Refresh notifications
      await loadNotifications();
    } catch (error) {
      console.error('Delete notifications error:', error);
      throw error;
    }
  }, [loadNotifications]);

  const handleMarkAsRead = React.useCallback(async (notificationIds: string[]) => {
    try {
      await Promise.all(
        notificationIds.map(id =>
          fetch(`http://localhost:8787/notifications/api/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
          })
        )
      );
      // Refresh notifications
      await loadNotifications();
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }, [loadNotifications]);

  const handleMarkAllAsRead = React.useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.readStatus && !n.isRead).map(n => n.id);
      await Promise.all(
        unreadIds.map(id =>
          fetch(`http://localhost:8787/notifications/api/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
          })
        )
      );
      await loadNotifications();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }, [notifications, loadNotifications]);

  const handleBulkDelete = React.useCallback(async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id =>
          fetch(`http://localhost:8787/notifications/api/${id}`, {
            method: 'DELETE',
          })
        )
      );
      await loadNotifications();
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  }, [selectedNotifications, loadNotifications]);

  const handleBulkMarkAsRead = React.useCallback(async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id =>
          fetch(`http://localhost:8787/notifications/api/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
          })
        )
      );
      await loadNotifications();
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Bulk mark as read error:', error);
    }
  }, [selectedNotifications, loadNotifications]);

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]
    );
  };

  const handleCreateApiKey = React.useCallback(async (data: { name: string; description?: string }) => {
    try {
      const response = await fetch('http://localhost:8787/notifications/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          permissions: ['notifications:create', 'notifications:read'],
          userId: 'test-user-123' // TODO: Get from auth session
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create API key');
      }
      
      // Reload the keys list
      await loadApiKeys();
      
      return { 
        key: result.data.key,
        id: result.data.id 
      };
    } catch (error: any) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  }, [loadApiKeys]);

  const handleRevokeApiKey = React.useCallback(async (keyId: string) => {
    try {
      const response = await fetch(`http://localhost:8787/notifications/api/keys/${keyId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete API key');
      }
      
      // Reload the keys list
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  }, [loadApiKeys]);

  const stats = React.useMemo(() => {
    const totalNotifications = notifications.length;
    const unreadCount = notifications.filter(n => !n.readStatus && !n.isRead).length;
    const readCount = notifications.filter(n => n.readStatus || n.isRead).length;
    const highPriorityCount = 0;
    const activeApiKeys = apiKeys.filter(k => k.isActive).length;

    return { totalNotifications, unreadCount, readCount, highPriorityCount, activeApiKeys };
  }, [notifications, apiKeys]);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Notifications</h1>
            <p className="text-white/60 text-sm">
              Manage your notifications and API integrations
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats Cards */}
            <div className="flex items-center gap-2">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="text-lg font-semibold text-white">{stats.totalNotifications}</div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Total</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="text-lg font-semibold text-blue-400">{stats.unreadCount}</div>
                <div className="text-[10px] text-blue-400/60 uppercase tracking-wider">Unread</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="text-lg font-semibold text-green-400">{stats.readCount}</div>
                <div className="text-[10px] text-green-400/60 uppercase tracking-wider">Read</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          {/* Custom Tab Buttons */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('notifications')}
              className={`flex-1 flex items-center justify-center gap-2 px-8 py-2.5 rounded-md transition-all ${
                selectedTab === 'notifications'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Notifications</span>
              {stats.unreadCount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs ml-1">
                  {stats.unreadCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('api-keys')}
              className={`flex-1 flex items-center justify-center gap-2 px-8 py-2.5 rounded-md transition-all ${
                selectedTab === 'api-keys'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Key className="h-4 w-4" />
              <span className="text-sm font-medium">API Keys</span>
              <Badge className="bg-white/10 text-white/70 border-white/20 text-xs ml-1">
                {stats.activeApiKeys}
              </Badge>
            </button>
            <button
              onClick={() => setSelectedTab('settings')}
              className={`flex-1 flex items-center justify-center gap-2 px-8 py-2.5 rounded-md transition-all ${
                selectedTab === 'settings'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>

          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-base">🔍</span>
                    Filters & Options
                  </h3>
                  <NotificationFilters
                    filters={filters}
                    onFiltersChange={(newFilters) => setFilters(newFilters)}
                    availableTags={availableTags}
                    variant="compact"
                    showAdvanced={true}
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg">
                  <div className="p-4 border-b border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold text-white">Your Notifications</h2>
                        {/* View Toggle */}
                        <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                          <button
                            onClick={() => setNotificationView('unread')}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${
                              notificationView === 'unread'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            Unread ({notifications.filter(n => !n.readStatus && !n.isRead).length})
                          </button>
                          <button
                            onClick={() => setNotificationView('read')}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${
                              notificationView === 'read'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            Read ({notifications.filter(n => n.readStatus || n.isRead).length})
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadNotifications}
                          className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10"
                          disabled={isLoadingNotifications}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsRead}
                          className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Mark All Read
                        </Button>
                      </div>
                    </div>
                    
                    {/* Bulk Actions Bar */}
                    {selectedNotifications.length > 0 && (
                      <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                        <span className="text-sm text-white/80">
                          {selectedNotifications.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBulkMarkAsRead}
                            className="h-7 text-xs text-white/70 hover:text-white hover:bg-white/10"
                          >
                            Mark as Read
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {notifications.filter(n => {
                        const isRead = n.readStatus || n.isRead;
                        return notificationView === 'unread' ? !isRead : isRead;
                      }).length === 0 ? (
                        <div className="text-center py-16">
                          <Bell className="h-12 w-12 text-white/20 mx-auto mb-3" />
                          <p className="text-sm text-white/50">No {notificationView} notifications</p>
                        </div>
                      ) : (
                        notifications.filter(n => {
                          const isRead = n.readStatus || n.isRead;
                          return notificationView === 'unread' ? !isRead : isRead;
                        }).map((notification) => {
                          const isRead = notification.readStatus || notification.isRead;
                          const isSelected = selectedNotifications.includes(notification.id);
                          return (
                          <div
                            key={notification.id}
                            className={`group relative rounded-lg p-4 transition-all duration-150 ${
                              isSelected 
                                ? 'bg-blue-500/20 border border-blue-500/50'
                                : isRead 
                                  ? 'bg-white/[0.02] border border-white/5 opacity-60 hover:bg-white/5 hover:border-white/10' 
                                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 border-l-2 border-l-blue-500 pl-[14px]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectNotification(notification.id);
                                }}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                              
                              {/* Blue dot indicator (unread) */}
                              {!isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}

                              {/* Content */}
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className={`font-medium text-sm leading-tight ${
                                    isRead ? 'text-white/40' : 'text-white'
                                  }`}>
                                    {notification.subject}
                                  </h3>
                                </div>
                                <p className={`text-xs leading-relaxed mb-2 ${
                                  isRead ? 'text-white/30' : 'text-white/60'
                                }`}>
                                  {notification.body}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {notification.tags.map((tag) => (
                                    <Badge key={tag} className={`text-[10px] px-2 py-0.5 ${
                                      isRead 
                                        ? 'bg-white/5 text-white/40 border-white/10' 
                                        : 'bg-white/10 text-white/80 border-white/20'
                                    }`}>
                                      {tag}
                                    </Badge>
                                  ))}
                                  <span className={`text-[10px] ml-auto ${
                                    isRead ? 'text-white/20' : 'text-white/40'
                                  }`}>
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {/* Delete Button - Shows on hover */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationDelete([notification.id]);
                                }}
                                className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400 transition-opacity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <ApiKeyManager
              apiKeys={apiKeys}
              onCreateKey={handleCreateApiKey}
              onRevokeKey={handleRevokeApiKey}
              showUsageStats={true}
              allowKeyCreation={true}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Notification Detail Overlay */}
      {detailNotification && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDetailNotification(null)}
        >
          <div 
            className="w-full max-w-3xl max-h-[85vh] bg-[#1E1E1E]/98 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-8">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {detailNotification.subject}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>Triggered:</span>
                    <span>{new Date(detailNotification.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailNotification(null)}
                  className="h-8 w-8 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
                
              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {detailNotification.readStatus || detailNotification.isRead ? 'Read' : 'Unread'}
                  </Badge>
                  {detailNotification.priority && (
                    <Badge className={`${
                      detailNotification.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      detailNotification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {detailNotification.priority.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4">
                  {detailNotification.tags.includes('workflow') && (
                    <>
                      <Button variant="outline" size="sm" className="h-8 bg-white/5 border-white/20 hover:bg-white/10">
                        <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 bg-white/5 border-white/20 hover:bg-white/10">
                        <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 bg-white/5 border-white/20 hover:bg-white/10">
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Re-run
                      </Button>
                    </>
                  )}
                  {!(detailNotification.readStatus || detailNotification.isRead) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await handleMarkAsRead([detailNotification.id]);
                        setDetailNotification(null);
                      }}
                      className="h-8 bg-white/5 border-white/20 hover:bg-white/10"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await handleNotificationDelete([detailNotification.id]);
                      setDetailNotification(null);
                    }}
                    className="h-8 ml-auto text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Tags */}
                {detailNotification.tags && detailNotification.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Tags:</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailNotification.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-white/5 text-white/80 border-white/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-3">Message:</h3>
                  <div className="bg-[#0F0F0F]/50 border border-white/10 rounded-lg p-4">
                    <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-sm">
                      {detailNotification.body}
                    </p>
                  </div>
                </div>

                {/* Run History - Only for workflow notifications */}
                {detailNotification.tags.includes('workflow') && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-3">Run History:</h3>
                    <div className="space-y-2">
                      <div className="bg-[#0F0F0F]/50 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white/80">Workflow Execution</span>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Completed
                          </Badge>
                        </div>
                        <div className="text-xs text-white/50">
                          {new Date(detailNotification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-3">Details:</h3>
                  <div className="bg-[#0F0F0F]/50 border border-white/10 rounded-lg p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">ID:</span>
                      <code className="text-white/70 bg-white/10 px-2 py-1 rounded text-xs font-mono">
                        {detailNotification.id.slice(0, 8)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Created:</span>
                      <span className="text-white/70 text-xs">
                        {new Date(detailNotification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {detailNotification.updatedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Updated:</span>
                        <span className="text-white/70 text-xs">
                          {new Date(detailNotification.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}