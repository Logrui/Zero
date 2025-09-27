/**
 * Database Seed Data
 * Development seed data for testing the notifications system
 */

import { randomUUID } from 'crypto';
import type { 
  User, 
  NewUser, 
  ApiKey, 
  NewApiKey, 
  Notification, 
  NewNotification,
  NotificationEvent,
  NewNotificationEvent 
} from './schema';

/**
 * Generate seed users
 */
export const seedUsers: NewUser[] = [
  {
    email: 'admin@zero.dev',
    name: 'System Administrator',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    isActive: true,
    metadata: {
      role: 'admin',
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    }
  },
  {
    email: 'developer@zero.dev',
    name: 'Zero Developer',
    avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
    isActive: true,
    metadata: {
      role: 'developer',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      }
    }
  },
  {
    email: 'tester@zero.dev',
    name: 'QA Tester',
    avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4',
    isActive: true,
    metadata: {
      role: 'tester',
      preferences: {
        theme: 'auto',
        notifications: {
          email: false,
          push: true,
          sms: true
        }
      }
    }
  }
];

/**
 * Generate seed API keys (with mock user IDs)
 */
export function seedApiKeys(userIds: string[]): NewApiKey[] {
  return [
    {
      userId: userIds[0], // admin user
      name: 'Development API Key',
      keyHash: 'hash_dev_key_12345', // In real app, this would be bcrypt hash
      keyPrefix: 'zro_dev1234',
      permissions: ['*'], // All permissions for admin
      isActive: true,
      metadata: {
        description: 'Main development API key',
        environment: 'development',
        createdBy: 'system'
      }
    },
    {
      userId: userIds[1], // developer user
      name: 'N8N Integration',
      keyHash: 'hash_n8n_key_67890',
      keyPrefix: 'zro_n8n5678',
      permissions: ['notifications:create', 'notifications:read'],
      isActive: true,
      metadata: {
        description: 'API key for N8N workflow automation',
        environment: 'production',
        integration: 'n8n'
      }
    },
    {
      userId: userIds[1], // developer user
      name: 'Mobile App Key',
      keyHash: 'hash_mobile_key_11111',
      keyPrefix: 'zro_mob1111',
      permissions: ['notifications:create', 'notifications:read', 'notifications:update'],
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      metadata: {
        description: 'API key for mobile application',
        environment: 'production',
        platform: 'mobile'
      }
    },
    {
      userId: userIds[2], // tester user
      name: 'Test Key - Expired',
      keyHash: 'hash_expired_key_22222',
      keyPrefix: 'zro_exp2222',
      permissions: ['notifications:read'],
      isActive: false,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
      metadata: {
        description: 'Expired test key for testing',
        environment: 'testing',
        expired: true
      }
    }
  ];
}

/**
 * Generate seed notifications (with mock user and API key IDs)
 */
export function seedNotifications(userIds: string[], apiKeyIds: string[]): NewNotification[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return [
    // Recent notifications
    {
      userId: userIds[0],
      apiKeyId: apiKeyIds[0],
      title: 'System Health Check',
      message: 'All systems are operating normally. Database: ✓ API: ✓ Storage: ✓',
      type: 'success',
      priority: 'medium',
      channel: 'system',
      status: 'sent',
      tags: ['system', 'health', 'monitoring'],
      sentAt: oneHourAgo.toISOString(),
      metadata: {
        systemCheck: true,
        metrics: {
          uptime: '99.9%',
          responseTime: '120ms',
          errorRate: '0.01%'
        }
      }
    },
    {
      userId: userIds[1],
      apiKeyId: apiKeyIds[1],
      title: 'N8N Workflow Completed',
      message: 'Weekly report generation workflow has completed successfully. 1,234 reports generated.',
      type: 'info',
      priority: 'low',
      channel: 'email',
      status: 'sent',
      tags: ['automation', 'n8n', 'reports'],
      sentAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      metadata: {
        workflow: 'weekly-reports',
        recordsProcessed: 1234,
        executionTime: '2m 15s'
      }
    },
    {
      userId: userIds[0],
      title: 'Security Alert',
      message: 'Unusual login detected from new IP address: 192.168.1.100. If this was not you, please secure your account immediately.',
      type: 'warning',
      priority: 'high',
      channel: 'email',
      status: 'sent',
      tags: ['security', 'login', 'alert'],
      sentAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 mins ago
      readAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // Read 10 mins ago
      metadata: {
        ipAddress: '192.168.1.100',
        location: 'Unknown',
        userAgent: 'Mozilla/5.0...'
      }
    },
    {
      userId: userIds[2],
      apiKeyId: apiKeyIds[2],
      title: 'Test Suite Results',
      message: 'Automated test suite completed with 95% pass rate. 2 failing tests need attention.',
      type: 'warning',
      priority: 'medium',
      channel: 'system',
      status: 'sent',
      tags: ['testing', 'automation', 'ci/cd'],
      sentAt: oneDayAgo.toISOString(),
      readAt: new Date(oneDayAgo.getTime() + 30 * 60 * 1000).toISOString(),
      metadata: {
        testSuite: 'integration-tests',
        totalTests: 150,
        passed: 143,
        failed: 2,
        skipped: 5
      }
    },
    
    // Scheduled notifications
    {
      userId: userIds[1],
      title: 'Weekly Backup Reminder',
      message: 'Remember to verify the weekly database backup has completed successfully.',
      type: 'info',
      priority: 'low',
      channel: 'email',
      status: 'pending',
      tags: ['backup', 'reminder', 'maintenance'],
      scheduledFor: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      metadata: {
        recurring: 'weekly',
        backupType: 'full',
        nextBackup: 'Sunday 02:00 UTC'
      }
    },
    
    // Failed notification
    {
      userId: userIds[2],
      title: 'Deployment Failed',
      message: 'Production deployment of version 1.2.3 has failed. Please check the deployment logs.',
      type: 'error',
      priority: 'urgent',
      channel: 'push',
      status: 'failed',
      tags: ['deployment', 'production', 'error'],
      retryCount: 3,
      maxRetries: 3,
      errorMessage: 'Connection timeout to deployment server',
      metadata: {
        version: '1.2.3',
        deploymentId: 'dep-12345',
        environment: 'production',
        failureReason: 'timeout'
      }
    },
    
    // Older notifications
    {
      userId: userIds[0],
      title: 'Monthly Security Report',
      message: 'Your monthly security report is now available. No critical issues detected this month.',
      type: 'success',
      priority: 'medium',
      channel: 'email',
      status: 'read',
      tags: ['security', 'report', 'monthly'],
      sentAt: oneWeekAgo.toISOString(),
      readAt: new Date(oneWeekAgo.getTime() + 60 * 60 * 1000).toISOString(),
      metadata: {
        reportType: 'security',
        period: 'monthly',
        criticalIssues: 0,
        totalScans: 45
      }
    },
    
    // Expired notification
    {
      userId: userIds[1],
      title: 'Limited Time Offer',
      message: 'Upgrade your plan to Pro and get 50% off for the first 3 months!',
      type: 'info',
      priority: 'low',
      channel: 'system',
      status: 'sent',
      tags: ['promotion', 'upgrade', 'expired'],
      sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: oneDayAgo.toISOString(), // Expired yesterday
      metadata: {
        promotion: 'pro-upgrade-50',
        discount: '50%',
        validUntil: oneDayAgo.toISOString()
      }
    }
  ];
}

/**
 * Generate seed notification events (with mock IDs)
 */
export function seedNotificationEvents(notificationIds: string[], userIds: string[]): NewNotificationEvent[] {
  return [
    // Events for successful notification
    {
      notificationId: notificationIds[0],
      eventType: 'created',
      createdBy: userIds[0],
      eventData: {
        source: 'system',
        automated: true
      }
    },
    {
      notificationId: notificationIds[0],
      eventType: 'sent',
      eventData: {
        channel: 'system',
        deliveryTime: '50ms'
      }
    },
    
    // Events for failed notification
    {
      notificationId: notificationIds[5], // Failed deployment notification
      eventType: 'created',
      createdBy: userIds[2],
      eventData: {
        source: 'ci/cd',
        triggeredBy: 'deployment-failure'
      }
    },
    {
      notificationId: notificationIds[5],
      eventType: 'send_attempted',
      eventData: {
        channel: 'push',
        attempt: 1,
        error: 'Push service unavailable'
      }
    },
    {
      notificationId: notificationIds[5],
      eventType: 'send_attempted',
      eventData: {
        channel: 'push',
        attempt: 2,
        error: 'Connection timeout'
      }
    },
    {
      notificationId: notificationIds[5],
      eventType: 'send_attempted',
      eventData: {
        channel: 'push',
        attempt: 3,
        error: 'Connection timeout'
      }
    },
    {
      notificationId: notificationIds[5],
      eventType: 'failed',
      eventData: {
        finalError: 'Max retries exceeded',
        totalAttempts: 3
      }
    },
    
    // Events for read notification
    {
      notificationId: notificationIds[2], // Security alert
      eventType: 'created',
      eventData: {
        source: 'security-monitor',
        automated: true,
        severity: 'high'
      }
    },
    {
      notificationId: notificationIds[2],
      eventType: 'sent',
      eventData: {
        channel: 'email',
        deliveryTime: '1.2s'
      }
    },
    {
      notificationId: notificationIds[2],
      eventType: 'read',
      createdBy: userIds[0],
      eventData: {
        readTime: '10m after sent',
        device: 'desktop'
      }
    }
  ];
}

/**
 * Mock function to seed the database
 * In real implementation, this would use the actual database connection
 */
export async function seedDatabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    users: number;
    apiKeys: number;
    notifications: number;
    events: number;
  };
}> {
  try {
    console.log('Starting database seeding...');
    
    // Mock IDs that would be generated by the database
    const mockUserIds = [
      randomUUID(),
      randomUUID(), 
      randomUUID()
    ];
    
    const mockApiKeyIds = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID()
    ];
    
    const mockNotificationIds = Array(8).fill(0).map(() => randomUUID());
    
    // Generate seed data
    const users = seedUsers;
    const apiKeys = seedApiKeys(mockUserIds);
    const notifications = seedNotifications(mockUserIds, mockApiKeyIds);
    const events = seedNotificationEvents(mockNotificationIds, mockUserIds);
    
    // In real implementation, you would insert this data into the database
    console.log(`Seeding ${users.length} users...`);
    console.log(`Seeding ${apiKeys.length} API keys...`);
    console.log(`Seeding ${notifications.length} notifications...`);
    console.log(`Seeding ${events.length} notification events...`);
    
    // Simulate database insertion delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: users.length,
        apiKeys: apiKeys.length,
        notifications: notifications.length,
        events: events.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Clear all seed data (for testing)
 */
export async function clearSeedData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Clearing seed data...');
    
    // In real implementation, you would delete the seed data
    // This might involve specific WHERE clauses to only delete seed data
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Seed data cleared successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to clear seed data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Development helper to reset and reseed the database
 */
export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Resetting database...');
    
    // Clear existing seed data
    const clearResult = await clearSeedData();
    if (!clearResult.success) {
      return clearResult;
    }
    
    // Reseed the database
    const seedResult = await seedDatabase();
    if (!seedResult.success) {
      return seedResult;
    }
    
    return {
      success: true,
      message: 'Database reset and reseeded successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Database reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}