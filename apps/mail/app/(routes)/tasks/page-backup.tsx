import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Calendar,
    CheckCircle2,
    CheckSquare,
    Circle,
    Clock,
    Filter,
    MoreVertical,
    Plus,
    Search,
    Users
} from 'lucide-react';

export default function TasksPageBackup() {
    const tasks = [
        { id: 1, title: 'Review pull request #234', status: 'in-progress', priority: 'high', assignee: 'John Doe', dueDate: '2025-10-05' },
        { id: 2, title: 'Update documentation', status: 'todo', priority: 'medium', assignee: 'Jane Smith', dueDate: '2025-10-07' },
        { id: 3, title: 'Fix bug in authentication', status: 'in-progress', priority: 'high', assignee: 'Mike Johnson', dueDate: '2025-10-04' },
        { id: 4, title: 'Design new landing page', status: 'completed', priority: 'low', assignee: 'Sarah Lee', dueDate: '2025-10-03' },
        { id: 5, title: 'Implement notification system', status: 'todo', priority: 'medium', assignee: 'John Doe', dueDate: '2025-10-08' },
    ];

    const statusColors = {
        'todo': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'completed': 'bg-green-500/20 text-green-400 border-green-500/30'
    };

    const priorityColors = {
        'low': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'high': 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground">
                        Manage and track your team's tasks and projects
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.length}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">+3</span> this week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {tasks.filter(t => t.status === 'in-progress').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active tasks
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {tasks.filter(t => t.status === 'completed').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">+2</span> this week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">
                            Within 2 days
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Tasks</CardTitle>
                            <CardDescription>
                                View and manage all tasks across your team
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search tasks..."
                                    className="pl-8 h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4 hover:bg-accent/50 transition-colors"
                            >
                                <button className="flex-shrink-0">
                                    {task.status === 'completed' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        <span>{task.assignee}</span>
                                        <span>•</span>
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                                        {task.priority}
                                    </Badge>
                                    <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                                        {task.status}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
