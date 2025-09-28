/**
 * Notifications Settings Page (E004)
 * 
 * Settings page for managing notification system configuration and API keys.
 * Features:
 * - API key generation and management
 * - Notification preferences
 * - Integration settings
 * - Breadcrumb navigation back to dashboard
 */

import * as React from 'react';
import { Link } from 'react-router';
import { ApiKeyManager } from '@/components/notifications/api-key-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, ChevronRight, Key, Bell } from 'lucide-react';

// Mock data for API keys (in real app, this would come from API)
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
  },
  {
    id: 'key-002', 
    name: 'Development Testing',
    description: 'API key for testing and development',
    keyPrefix: 'zos_dev_9876543210fedcba',
    isActive: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 100 },
    usage: { totalRequests: 450, thisMonth: 89 }
  }
];

export default function NotificationSettingsPage() {
  const handleCreateApiKey = React.useCallback(async (data: { name: string; description?: string }) => {
    console.log('Create API key:', data);
    // In real app, this would call the API
    return { 
      key: `zos_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`, 
      id: `key-new-${Date.now()}` 
    };
  }, []);

  const handleRevokeApiKey = React.useCallback(async (keyId: string) => {
    console.log('Revoke API key:', keyId);
    // In real app, this would call the API
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with breadcrumb */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/notifications" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Notifications
              </Link>
            </Button>
            
            {/* Simple breadcrumb navigation */}
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Link to="/notifications" className="hover:text-white">
                Notifications
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Settings</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2 text-white">
              <Settings className="h-8 w-8" />
              Notification Settings
            </h1>
            <p className="text-white/70 text-lg">
              Configure your notification preferences and manage API keys for external integrations
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* API Key Management Section */}
          <Card className="bg-[#111111]/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <p className="text-sm text-white/70">
                Generate and manage API keys for external applications like N8N, Zapier, and custom integrations.
              </p>
            </CardHeader>
            <CardContent>
              <ApiKeyManager
                apiKeys={mockApiKeys}
                onCreateKey={handleCreateApiKey}
                onRevokeKey={handleRevokeApiKey}
                showUsageStats={true}
                allowKeyCreation={true}
              />
            </CardContent>
          </Card>

          {/* Notification Preferences Section */}
          <Card className="bg-[#111111]/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <p className="text-sm text-white/70">
                Configure how you receive and view notifications.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Email Notifications</h4>
                    <p className="text-sm text-white/70">Receive notifications via email</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Push Notifications</h4>
                    <p className="text-sm text-white/70">Browser push notifications</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Data Retention</h4>
                    <p className="text-sm text-white/70">How long to keep notifications</p>
                  </div>
                  <Button variant="outline" size="sm">
                    30 Days
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔗 Integration Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure external integrations and webhook endpoints.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Webhook Endpoint</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use this endpoint for external applications to send notifications:
                  </p>
                  <code className="text-sm bg-background p-2 rounded border block">
                    POST https://api.zero.dev/api/notifications
                  </code>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Rate Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Default: 60 requests per minute, 1000 requests per hour
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}