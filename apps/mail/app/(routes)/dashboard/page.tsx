import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Activity,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router';

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your activity.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+3</span> since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-15min</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest email interactions and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">New email from John Doe</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
              <Badge variant="secondary">Inbox</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Email sent to Sarah Wilson</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
              <Badge variant="outline">Sent</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Meeting scheduled with team</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
              <Badge variant="secondary">Calendar</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">High priority email received</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
              <Badge variant="destructive">Important</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/mail/create">
                <Mail className="mr-2 h-4 w-4" />
                Compose Email
              </Link>
            </Button>
            
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/mail/inbox">
                <Inbox className="mr-2 h-4 w-4" />
                View Inbox
              </Link>
            </Button>
            
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Open Calendar
              </Link>
            </Button>
            
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/settings/general">
                <Users className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email Summary</CardTitle>
            <CardDescription>
              Overview of your email activity this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Emails Sent</span>
                <span className="text-sm text-muted-foreground">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Emails Received</span>
                <span className="text-sm text-muted-foreground">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Emails Archived</span>
                <span className="text-sm text-muted-foreground">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Spam Filtered</span>
                <span className="text-sm text-muted-foreground">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Insights</CardTitle>
            <CardDescription>
              Tips to improve your email workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mt-0.5">
                  <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Peak Activity</p>
                  <p className="text-xs text-muted-foreground">
                    You're most active between 9-11 AM
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Response Rate</p>
                  <p className="text-xs text-muted-foreground">
                    Great job maintaining 87% response rate!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900 mt-0.5">
                  <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Suggestion</p>
                  <p className="text-xs text-muted-foreground">
                    Consider using templates for faster responses
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
