'use client';

import * as React from 'react';
// Note: useRouter and useParams imports removed due to missing Next.js types
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Mock notification data (in real app, this would be fetched via API)
const mockNotifications = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    subject: 'System Update Available',
    body: 'A new system update is available for your Zero OS installation. This update includes security patches and performance improvements.',
    tags: ['system', 'update'],
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    isRead: false,
    priority: 'medium' as const,
    source: 'system'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    subject: 'Backup Completed Successfully',
    body: 'Your scheduled backup has completed successfully. 127 files were backed up to secure storage.',
    tags: ['backup', 'success'],
    createdAt: '2023-12-01T09:30:00Z',
    updatedAt: '2023-12-01T09:30:00Z',
    isRead: true,
    priority: 'low' as const,
    source: 'backup-service'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    subject: 'API Rate Limit Warning',
    body: 'Your application is approaching the API rate limit. Current usage: 4,750/5,000 requests per hour.',
    tags: ['api', 'warning', 'rate-limit'],
    createdAt: '2023-12-01T09:15:00Z',
    updatedAt: '2023-12-01T09:15:00Z',
    isRead: false,
    priority: 'high' as const,
    source: 'api-gateway'
  }
];

interface NotificationPageProps {
  params: {
    uuid: string;
  };
}

export default function NotificationPage({ params }: NotificationPageProps) {
  // Mock router for navigation (in real app, use Next.js useRouter)
  const router = {
    push: (path: string) => {
      console.log('Navigate to:', path);
      // In real app, this would actually navigate
    }
  };
  
  const notification = mockNotifications.find(n => n.id === params.uuid);
  
  const [isMarkingRead, setIsMarkingRead] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Handle case where notification is not found
  if (!notification) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Notification Not Found</h1>
          <p className="text-muted-foreground">
            The notification you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/notifications')}>
            ← Back to Notifications
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkAsRead = async () => {
    setIsMarkingRead(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification deleted');
      router.push('/notifications');
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚫';
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/notifications')}
          className="flex items-center gap-2"
        >
          ← Back to Notifications
        </Button>
        
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              disabled={isMarkingRead}
              className="flex items-center gap-2"
            >
              👁️ Mark as Read
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Notification Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{notification.subject}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    👤 {notification.source}
                  </div>
                  <div className="flex items-center gap-1">
                    🕒 {formatDate(notification.createdAt)}
                  </div>
                  {notification.createdAt !== notification.updatedAt && (
                    <div className="flex items-center gap-1">
                      📝 Updated {formatDate(notification.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityColor(notification.priority)} className="flex items-center gap-1">
                  {getPriorityEmoji(notification.priority)}
                  {notification.priority.toUpperCase()}
                </Badge>
                {!notification.isRead && (
                  <Badge variant="destructive">
                    Unread
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Notification Body */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>{notification.body}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {notification.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {notification.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    🏷️ {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">ID</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {notification.id}
                </div>
              </div>
              <div>
                <div className="font-medium">Source</div>
                <div className="text-muted-foreground">
                  {notification.source}
                </div>
              </div>
              <div>
                <div className="font-medium">Priority</div>
                <div className="flex items-center gap-1">
                  {getPriorityEmoji(notification.priority)}
                  {notification.priority}
                </div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="flex items-center gap-1">
                  {notification.isRead ? '✅ Read' : '⭕ Unread'}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <div>Created: {formatDate(notification.createdAt)}</div>
              {notification.createdAt !== notification.updatedAt && (
                <div>Last updated: {formatDate(notification.updatedAt)}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {!notification.isRead && (
                <Button
                  variant="default"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingRead}
                  className="flex items-center gap-2"
                >
                  👁️ Mark as Read
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(notification.id);
                  toast.success('Notification ID copied to clipboard');
                }}
                className="flex items-center gap-2"
              >
                📋 Copy ID
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const content = `Subject: ${notification.subject}
Body: ${notification.body}
Tags: ${notification.tags.join(', ')}
Source: ${notification.source}
Priority: ${notification.priority}
Created: ${formatDate(notification.createdAt)}`;
                  
                  navigator.clipboard.writeText(content);
                  toast.success('Notification details copied to clipboard');
                }}
                className="flex items-center gap-2"
              >
                📄 Copy Details
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 ml-auto"
              >
                🗑️ Delete Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}