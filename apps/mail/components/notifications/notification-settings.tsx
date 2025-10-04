/**
 * Notification Settings Component
 * 
 * Modular settings content for managing notification system configuration.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Code2 } from 'lucide-react';

export function NotificationSettings() {
  return (
    <div className="grid grid-cols-1 gap-6">
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
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings Section */}
      <Card className="bg-[#111111]/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Code2 className="h-5 w-5" />
            External API Integration
          </CardTitle>
          <p className="text-sm text-white/70">
            Send notifications to your Zero inbox from external applications like N8N, Zapier, or custom scripts.
          </p>
        </CardHeader>
        <CardContent className="max-h-[350px] overflow-y-auto pr-2 scrollbar scrollbar-w-0 scrollbar-thumb-accent/40 scrollbar-track-transparent hover:scrollbar-thumb-accent scrollbar-thumb-rounded-full">
          <div className="space-y-6">
            {/* Endpoint Section */}
            <div>
              <h4 className="font-medium mb-3 text-white">API Endpoint</h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-white/70 mb-3">
                  Use this endpoint to send notifications:
                </p>
                <code className="text-sm bg-[#0F0F0F] text-white/90 p-3 rounded border border-white/20 block font-mono">
                  POST http://localhost:8787/notifications/api
                </code>
              </div>
            </div>

            {/* Authentication Section */}
            <div>
              <h4 className="font-medium mb-3 text-white">Authentication</h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <p className="text-sm text-white/70">
                  Include your API key in the request headers:
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded border border-white/20">
                  <code className="text-xs text-white/90 font-mono block">
                    X-API-Key: your_api_key_here
                  </code>
                </div>
                <p className="text-xs text-white/60 flex items-center gap-1">
                  <span>💡</span>
                  Generate API keys in the <strong className="text-white/80">API Keys</strong> tab
                </p>
              </div>
            </div>

            {/* Request Format Section */}
            <div>
              <h4 className="font-medium mb-3 text-white">Request Format</h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <p className="text-sm text-white/70 mb-2">
                  Send a JSON payload with the following fields:
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded border border-white/20 overflow-x-auto">
                  <pre className="text-xs text-white/90 font-mono">
{`{
  "subject": "Your notification title",
  "body": "Notification message content",
  "userId": "test-user-123",
  "priority": "high",    // Optional: low, medium, high
  "tags": ["API", "Test"]  // Optional: array of tags
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Example Request Section */}
            <div>
              <h4 className="font-medium mb-3 text-white">Example Request</h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-white/70 mb-3">
                  cURL example:
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded border border-white/20 overflow-x-auto">
                  <pre className="text-xs text-white/90 font-mono leading-relaxed">
{`curl -X POST http://localhost:8787/notifications/api \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: zro_your_api_key_here" \\
  -d '{
    "subject": "Deployment Complete",
    "body": "Production deployment finished successfully",
    "userId": "test-user-123",
    "priority": "high",
    "tags": ["Deployment", "Production"]
  }'`}
                  </pre>
                </div>
              </div>
            </div>

            {/* PowerShell Example */}
            <div>
              <h4 className="font-medium mb-3 text-white">PowerShell Example</h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="bg-[#0F0F0F] p-3 rounded border border-white/20 overflow-x-auto">
                  <pre className="text-xs text-white/90 font-mono leading-relaxed">
{`$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "zro_your_api_key_here"
}

$body = @{
    subject = "Alert: High CPU Usage"
    body = "Server CPU usage exceeded 90%"
    userId = "test-user-123"
    priority = "high"
    tags = @("Alert", "Infrastructure")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8787/notifications/api" \`
    -Method POST -Headers $headers -Body $body`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Rate Limits & Response */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-medium mb-2 text-white">Rate Limits</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  <li>• 60 requests per minute</li>
                  <li>• 1,000 requests per hour</li>
                </ul>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-medium mb-2 text-white">Success Response</h4>
                <div className="bg-[#0F0F0F] p-2 rounded border border-white/20">
                  <pre className="text-xs text-white/90 font-mono">
{`{
  "success": true,
  "data": {
    "id": "notification-id"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
