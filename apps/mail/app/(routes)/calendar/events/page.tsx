import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Mail,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { Link } from 'react-router';

export default function CalendarEventsPage() {
  const events = [
    {
      id: 1,
      title: 'Q4 Planning Meeting',
      description: 'Quarterly planning session with leadership team',
      date: '2025-10-05',
      time: '10:00 AM',
      duration: '2 hours',
      location: 'Conference Room A',
      type: 'meeting',
      organizer: 'Sarah Johnson',
      attendees: 12,
      source: 'email',
      confidence: 95,
      status: 'confirmed',
      isVirtual: false,
      parsedFrom: 'sarah.j@company.com',
      parsedAt: '2025-10-03 14:30'
    },
    {
      id: 2,
      title: 'Client Demo - Acme Corp',
      description: 'Product demonstration for new client onboarding',
      date: '2025-10-05',
      time: '02:30 PM',
      duration: '1 hour',
      location: 'Virtual',
      type: 'demo',
      organizer: 'Mike Chen',
      attendees: 6,
      source: 'email',
      confidence: 98,
      status: 'confirmed',
      isVirtual: true,
      meetingLink: 'https://meet.zero.email/demo-acme',
      parsedFrom: 'mike.chen@company.com',
      parsedAt: '2025-10-04 09:15'
    },
    {
      id: 3,
      title: 'Team Standup',
      description: 'Daily engineering team sync',
      date: '2025-10-06',
      time: '09:00 AM',
      duration: '30 min',
      location: 'Virtual',
      type: 'standup',
      organizer: 'Engineering Team',
      attendees: 8,
      source: 'email',
      confidence: 92,
      status: 'pending',
      isVirtual: true,
      meetingLink: 'https://meet.zero.email/standup',
      parsedFrom: 'team@company.com',
      parsedAt: '2025-10-04 08:00'
    },
    {
      id: 4,
      title: 'Board Meeting',
      description: 'Monthly board of directors meeting',
      date: '2025-10-08',
      time: '03:00 PM',
      duration: '3 hours',
      location: 'Executive Boardroom',
      type: 'board-meeting',
      organizer: 'Executive Assistant',
      attendees: 15,
      source: 'email',
      confidence: 88,
      status: 'tentative',
      isVirtual: false,
      parsedFrom: 'exec@company.com',
      parsedAt: '2025-10-03 16:45'
    },
    {
      id: 5,
      title: 'Design Review Session',
      description: 'Review new UI designs for mobile app',
      date: '2025-10-06',
      time: '11:00 AM',
      duration: '1.5 hours',
      location: 'Virtual',
      type: 'review',
      organizer: 'Design Team',
      attendees: 5,
      source: 'email',
      confidence: 85,
      status: 'pending',
      isVirtual: true,
      meetingLink: 'https://meet.zero.email/design-review',
      parsedFrom: 'design@company.com',
      parsedAt: '2025-10-04 10:20'
    },
  ];

  const typeColors = {
    meeting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    demo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    standup: 'bg-green-500/20 text-green-400 border-green-500/30',
    'board-meeting': 'bg-red-500/20 text-red-400 border-red-500/30',
    review: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  };

  const statusConfig = {
    confirmed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
    pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
    tentative: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Calendar Events</h1>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              AI-Parsed
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Events automatically detected from your inbox emails
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parsed Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to attend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(events.reduce((sum, e) => sum + e.confidence, 0) / events.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Parsing accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virtual Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.isVirtual).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Remote sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search events..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => {
          const StatusIcon = statusConfig[event.status as keyof typeof statusConfig].icon;
          
          return (
            <Card key={event.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 text-center bg-primary/10 rounded-lg p-3 min-w-[70px]">
                    <div className="text-2xl font-bold text-primary">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{event.title}</h3>
                          <Badge className={statusConfig[event.status as keyof typeof statusConfig].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {event.status}
                          </Badge>
                          <Badge variant="outline" className={typeColors[event.type as keyof typeof typeColors]}>
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    {/* Event Metadata */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{event.time} • {event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">From: {event.parsedFrom}</span>
                      </div>
                    </div>

                    {/* Parsing Info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Organizer:</span>
                        <span>{event.organizer}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Confidence:</span>
                        <Badge variant="outline" className={
                          event.confidence >= 95 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          event.confidence >= 90 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }>
                          {event.confidence}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Parsed:</span>
                        <span>{event.parsedAt}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="default">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Confirm & Add to Calendar
                      </Button>
                      {event.isVirtual && event.meetingLink && (
                        <Button size="sm" variant="outline">
                          <Video className="h-3.5 w-3.5 mr-1" />
                          Join Meeting
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Email
                      </Button>
                      <Button size="sm" variant="ghost">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="border-dashed bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            About AI Event Parsing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Zero OS automatically scans your inbox for event invitations and meeting requests. 
            Events are parsed using AI to extract date, time, location, attendees, and other details. 
            Review and confirm events to add them to your calendar. The confidence score indicates 
            the accuracy of the parsed information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
