import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Workflow,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Settings,
  Code,
  Zap,
  Terminal,
  FileCode,
  Clock,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router';

export default function WorkflowsPage() {
  const workflows = [
    {
      id: 1,
      name: 'Email Classification',
      description: 'Automatically classify and route incoming emails based on content',
      prompt: 'Analyze the email content and classify into categories: urgent, informational, action-required, or spam...',
      status: 'active',
      lastRun: '2 min ago',
      executions: 1284,
      commands: ['/classify', '/categorize'],
      category: 'email'
    },
    {
      id: 2,
      name: 'Meeting Scheduler',
      description: 'Parse meeting requests and automatically schedule calendar events',
      prompt: 'Extract meeting details including date, time, participants, and agenda from the text...',
      status: 'active',
      lastRun: '15 min ago',
      executions: 456,
      commands: ['/schedule', '/book-meeting'],
      category: 'scheduling'
    },
    {
      id: 3,
      name: 'Task Extractor',
      description: 'Identify action items and create tasks from emails and messages',
      prompt: 'Scan the content for action items, deadlines, and responsibilities. Create structured tasks...',
      status: 'draft',
      lastRun: 'Never',
      executions: 0,
      commands: ['/extract-tasks', '/action-items'],
      category: 'productivity'
    },
    {
      id: 4,
      name: 'Smart Reply Generator',
      description: 'Generate contextual email replies based on conversation history',
      prompt: 'Analyze the email thread and generate 3 appropriate response options considering tone and context...',
      status: 'active',
      lastRun: '1 hour ago',
      executions: 892,
      commands: ['/reply', '/suggest-response'],
      category: 'email'
    },
    {
      id: 5,
      name: 'Data Analyzer',
      description: 'Process and extract insights from structured data',
      prompt: 'Analyze the provided data and generate a summary with key insights, trends, and recommendations...',
      status: 'paused',
      lastRun: '1 day ago',
      executions: 234,
      commands: ['/analyze', '/insights'],
      category: 'analytics'
    },
  ];

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const categoryColors = {
    email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    scheduling: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    productivity: 'bg-green-500/20 text-green-400 border-green-500/30',
    analytics: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage AI prompts and command configurations for Zero OS
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{workflows.filter(w => w.status === 'active').length}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.executions, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+247</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Commands</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.commands.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered commands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.3s</span> from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search workflows..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileCode className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Code className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      workflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      workflow.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{workflow.name}</CardTitle>
                        <Badge className={statusColors[workflow.status as keyof typeof statusColors]}>
                          {workflow.status}
                        </Badge>
                        <Badge variant="outline" className={categoryColors[workflow.category as keyof typeof categoryColors]}>
                          {workflow.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {workflow.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Prompt Preview */}
                  <div className="mt-3 bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Prompt</span>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-2 font-mono">
                      {workflow.prompt}
                    </p>
                  </div>

                  {/* Commands */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Commands:</span>
                    {workflow.commands.map((cmd, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs font-mono">
                        {cmd}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{workflow.executions.toLocaleString()} executions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Last run: {workflow.lastRun}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {workflow.status === 'active' ? (
                    <Button variant="outline" size="sm" className="h-8">
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8">
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Activate
                    </Button>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Create Workflow</p>
                <p className="text-xs text-muted-foreground">Define your prompt and commands</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Configure Settings</p>
                <p className="text-xs text-muted-foreground">Set parameters and triggers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Activate & Test</p>
                <p className="text-xs text-muted-foreground">Enable workflow and monitor</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
