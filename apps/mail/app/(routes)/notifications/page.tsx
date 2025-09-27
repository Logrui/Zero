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

import { NotificationOverlay } from '@/components/notifications/notification-overlay';
import { NotificationFilters } from '@/components/notifications/notification-filters';
import { ApiKeyManager } from '@/components/notifications/api-key-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your notifications and API integrations
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalNotifications}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.unreadCount}</div>
              <div className="text-xs text-muted-foreground">Unread</div>
            </div>
            {stats.highPriorityCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{stats.highPriorityCount}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
            )}
          </div>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              📬 Notifications
              {stats.unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              🔑 API Keys
              <Badge variant="secondary" className="text-xs">
                {stats.activeApiKeys}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Filters</CardTitle>
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
                <Card>
                  <CardContent className="p-0">
                    <div className="min-h-[600px] relative">
                      <NotificationOverlay
                        isOpen={true}
                        onClose={() => {}}
                        notifications={mockNotifications}
                        onNotificationClick={(notification) => handleNotificationClick(notification as any)}
                        onNotificationDelete={handleNotificationDelete}
                        onMarkAsRead={handleMarkAsRead}
                        className="border-0 shadow-none relative max-w-none h-auto"
                      />
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