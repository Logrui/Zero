import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Bell
} from 'lucide-react';
import { Link } from 'react-router';

export default function SchedulingPage() {
  const events = [
    { 
      id: 1, 
      title: 'Team Standup', 
      time: '09:00 AM',
      duration: '30 min',
      type: 'meeting',
      attendees: 8,
      location: 'Virtual',
      date: '2025-10-04'
    },
    { 
      id: 2, 
      title: 'Client Presentation', 
      time: '02:00 PM',
      duration: '1 hour',
      type: 'presentation',
      attendees: 5,
      location: 'Conference Room A',
      date: '2025-10-04'
    },
    { 
      id: 3, 
      title: 'Design Review', 
      time: '04:30 PM',
      duration: '45 min',
      type: 'review',
      attendees: 6,
      location: 'Virtual',
      date: '2025-10-04'
    },
    { 
      id: 4, 
      title: 'Sprint Planning', 
      time: '10:00 AM',
      duration: '2 hours',
      type: 'planning',
      attendees: 12,
      location: 'Virtual',
      date: '2025-10-05'
    },
  ];

  const typeColors = {
    meeting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    presentation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    review: 'bg-green-500/20 text-green-400 border-green-500/30',
    planning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduling</h1>
          <p className="text-muted-foreground">
            Manage your calendar and upcoming events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.date === '2025-10-04').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> from last week
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
              {events.filter(e => e.location === 'Virtual').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Remote sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.reduce((sum, e) => sum + e.attendees, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Widget */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>October 2025</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 2;
                  const isToday = day === 4;
                  const hasEvent = day === 4 || day === 5;
                  return (
                    <button
                      key={i}
                      className={`h-8 w-8 rounded-md text-sm transition-colors ${
                        day < 1 || day > 31
                          ? 'text-muted-foreground/30'
                          : isToday
                          ? 'bg-primary text-primary-foreground'
                          : hasEvent
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-accent'
                      }`}
                      disabled={day < 1 || day > 31}
                    >
                      {day > 0 && day <= 31 ? day : ''}
                    </button>
                  );
                })}
              </div>
              
              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded bg-primary"></div>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded bg-accent"></div>
                  <span className="text-muted-foreground">Has events</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Your scheduled meetings and appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 text-center">
                    <div className="text-2xl font-bold">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium">{event.title}</h3>
                      <Badge className={typeColors[event.type as keyof typeof typeColors]}>
                        {event.type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{event.time} • {event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {event.location === 'Virtual' && (
                      <Button size="sm" className="h-8">
                        <Video className="h-3 w-3 mr-1" />
                        Join
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
