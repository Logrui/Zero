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
import { Settings, Key, Bell, Trash2 } from 'lucide-react';

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
    const highPriorityCount = 0; // Mock data only has medium priority notifications
    const activeApiKeys = mockApiKeys.filter(k => k.isActive).length;
    
    return { totalNotifications, unreadCount, highPriorityCount, activeApiKeys };
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Notifications</h1>
            <p className="text-white/70 text-lg">
              Manage your notifications and API integrations
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/notifications/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalNotifications}</div>
              <div className="text-xs text-white/60">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.unreadCount}</div>
              <div className="text-xs text-white/60">Unread</div>
            </div>
            {stats.highPriorityCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.highPriorityCount}</div>
                <div className="text-xs text-white/60">High Priority</div>
              </div>
            )}
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
                <Card className="bg-gradient-to-br from-[#111111]/80 to-[#0A0A0A]/80 border-white/20 backdrop-blur-lg shadow-2xl rounded-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2 font-semibold">
                      <span>🔧</span>
                      Filters & Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <NotificationFilters
                      filters={filters}
                      onFiltersChange={(newFilters) => setFilters(newFilters)}
                      availableTags={availableTags}
                      variant="sidebar"
                      showAdvanced={true}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-3">
                <Card className="bg-gradient-to-br from-[#111111]/80 to-[#0A0A0A]/80 border-white/20 backdrop-blur-lg shadow-2xl rounded-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center justify-between text-white font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔔</span>
                        Your Notifications
                        <Badge variant="secondary" className="bg-blue-500/80 text-white border-blue-400/50 px-3 py-1">
                          {mockNotifications.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/30 text-white hover:bg-white/15 rounded-lg backdrop-blur-sm"
                        >
                          <span className="mr-2">✓</span>
                          Mark All Read
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/30 text-white hover:bg-white/15 rounded-lg backdrop-blur-sm"
                        >
                          <span className="mr-2">🗑️</span>
                          Clear All
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockNotifications.length === 0 ? (
                        <div className="text-center py-12">
                          <Bell className="h-12 w-12 text-white/40 mx-auto mb-4" />
                          <p className="text-white/60">No notifications found</p>
                        </div>
                      ) : (
                        mockNotifications.map((notification) => (
                          <Card 
                            key={notification.id}
                            className={`cursor-pointer transition-all duration-200 hover:bg-white/5 border-white/10 bg-[#1A1A1A]/30 ${
                              !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-500/5' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm mb-1 text-white">
                                    {notification.subject}
                                  </h3>
                                  <p className="text-sm text-white/70 mb-2">
                                    {notification.body}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {notification.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    <span className="text-xs text-white/50 ml-auto">
                                      {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationDelete([notification.id]);
                                  }}
                                  className="ml-2 hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
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