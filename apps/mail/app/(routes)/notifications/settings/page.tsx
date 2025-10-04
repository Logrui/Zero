/**
 * Notifications Settings Page (E004)
 * 
 * Settings page for managing notification system configuration.
 * Features:
 * - Notification preferences
 * - Integration settings
 * - Breadcrumb navigation back to dashboard
 * 
 * Note: API key management is now in the API Keys tab on the main notifications page.
 */

import * as React from 'react';
import { Link } from 'react-router';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, ChevronRight } from 'lucide-react';

export default function NotificationSettingsPage() {
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
              Configure your notification preferences and integration settings
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <NotificationSettings />
      </div>
    </div>
  );
}