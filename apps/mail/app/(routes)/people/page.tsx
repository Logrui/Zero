import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Search,
  Filter,
  MoreVertical,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router';

export default function PeoplePage() {
  const people = [
    { 
      id: 1, 
      name: 'John Doe', 
      role: 'Software Engineer',
      department: 'Engineering',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      status: 'active',
      avatar: 'JD'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      role: 'Product Manager',
      department: 'Product',
      email: 'jane.smith@company.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      status: 'active',
      avatar: 'JS'
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      role: 'Designer',
      department: 'Design',
      email: 'mike.j@company.com',
      phone: '+1 (555) 345-6789',
      location: 'Austin, TX',
      status: 'away',
      avatar: 'MJ'
    },
    { 
      id: 4, 
      name: 'Sarah Lee', 
      role: 'Marketing Director',
      department: 'Marketing',
      email: 'sarah.lee@company.com',
      phone: '+1 (555) 456-7890',
      location: 'Boston, MA',
      status: 'active',
      avatar: 'SL'
    },
    { 
      id: 5, 
      name: 'David Chen', 
      role: 'Data Scientist',
      department: 'Engineering',
      email: 'david.chen@company.com',
      phone: '+1 (555) 567-8901',
      location: 'Seattle, WA',
      status: 'offline',
      avatar: 'DC'
    },
    { 
      id: 6, 
      name: 'Emily Brown', 
      role: 'Sales Manager',
      department: 'Sales',
      email: 'emily.brown@company.com',
      phone: '+1 (555) 678-9012',
      location: 'Chicago, IL',
      status: 'active',
      avatar: 'EB'
    },
  ];

  const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales'];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground">
            Manage your team members and contacts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {people.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Online members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Away</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {people.filter(p => p.status === 'away').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Temporarily unavailable
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search people..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <Card key={person.id} className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {person.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    person.status === 'active' ? 'bg-green-500' :
                    person.status === 'away' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{person.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {person.role}
                  </CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {person.department}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{person.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{person.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{person.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
