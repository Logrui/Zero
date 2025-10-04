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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, Bell, Trash2, Eye } from 'lucide-react';

// Note: Metadata export removed due to missing Next.js types

// Mock data for demonstration
const mockNotifications = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    subject: 'N8N Workflow Completed',
    body: 'Your data processing workflow has completed successfully.',
    tags: ['N8N', 'Automation', 'Success'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isRead: false,
    priority: 'medium' as const,
    source: 'N8N Automation'
  }
];

const mockApiKeys = [
  {
    id: 'key-001',
    name: 'N8N Production',
    description: 'API key for N8N automation workflows',
    keyPrefix: 'zos_prod_1234567890abcdef',
    isActive: true,
    createdAt: new Date().toISOString(),
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
    usage: { totalRequests: 15420, thisMonth: 2340 }
  }
];

export default function NotificationsPage() {
  const [filters, setFilters] = React.useState({
    tags: [] as string[],
    searchQuery: '',
    showUnreadOnly: false,
    priority: [] as ('medium' | 'low' | 'high')[]
  });

  const [selectedTab, setSelectedTab] = React.useState('notifications');

  const availableTags = React.useMemo(() => {
    const tagMap = new Map<string, number>();
    mockNotifications.forEach(notification => {
      notification.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
  }, []);

  const handleNotificationClick = React.useCallback((notification: typeof mockNotifications[0]) => {
    console.log('Navigate to notification:', notification.id);
  }, []);

  const handleNotificationDelete = React.useCallback(async (notificationIds: string[]) => {
    console.log('Delete notifications:', notificationIds);
  }, []);

  const handleMarkAsRead = React.useCallback(async (notificationIds: string[]) => {
    console.log('Mark as read:', notificationIds);
  }, []);

  const handleCreateApiKey = React.useCallback(async (data: { name: string; description?: string }) => {
    console.log('Create API key:', data);
    return { key: 'zos_new_1234567890abcdef', id: 'key-new-001' };
  }, []);

  const handleRevokeApiKey = React.useCallback(async (keyId: string) => {
    console.log('Revoke API key:', keyId);
  }, []);

  const stats = React.useMemo(() => {
    const totalNotifications = mockNotifications.length;
    const unreadCount = mockNotifications.filter(n => !n.isRead).length;
    const highPriorityCount = 0;
    const activeApiKeys = mockApiKeys.filter(k => k.isActive).length;

    return { totalNotifications, unreadCount, highPriorityCount, activeApiKeys };
  }, []);

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
              {stats.highPriorityCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="text-lg font-semibold text-red-400">{stats.highPriorityCount}</div>
                  <div className="text-[10px] text-red-400/60 uppercase tracking-wider">Urgent</div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 h-9">
              <Link to="/notifications/settings" className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                <span className="text-sm">Settings</span>
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white">
              <Bell className="h-4 w-4" />
              Notifications
              {stats.unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white">
              <Key className="h-4 w-4" />
              API Keys
              <Badge variant="secondary" className="text-xs">
                {stats.activeApiKeys}
              </Badge>
            </TabsTrigger>
          </TabsList>

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
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <h2 className="text-base font-semibold text-white">Your Notifications</h2>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {mockNotifications.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Mark All Read
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {mockNotifications.length === 0 ? (
                        <div className="text-center py-16">
                          <Bell className="h-12 w-12 text-white/20 mx-auto mb-3" />
                          <p className="text-sm text-white/50">No notifications yet</p>
                        </div>
                      ) : (
                        mockNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`group relative bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer transition-all duration-150 hover:bg-white/10 hover:border-white/20 ${!notification.isRead ? 'border-l-2 border-l-blue-500 pl-[14px]' : ''
                              }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center">
                                <Bell className="h-4 w-4 text-orange-400" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-medium text-sm text-white leading-tight">
                                    {notification.subject}
                                  </h3>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                  )}
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed mb-2">
                                  {notification.body}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {notification.tags.map((tag) => (
                                    <Badge key={tag} className="bg-white/10 text-white/80 border-white/20 text-[10px] px-2 py-0.5">
                                      {tag}
                                    </Badge>
                                  ))}
                                  <span className="text-[10px] text-white/40 ml-auto">
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <ApiKeyManager
              apiKeys={mockApiKeys}
              onCreateKey={handleCreateApiKey}
              onRevokeKey={handleRevokeApiKey}
              showUsageStats={true}
              allowKeyCreation={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}