import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  MapPin,
  Mail,
  Plus,
  Settings,
  Search,
  MoreVertical,
  Phone,
  Globe
} from 'lucide-react';
import { Link } from 'react-router';

export default function OrganizationsPage() {
  const organizations = [
    { 
      id: 1, 
      name: 'Acme Corporation', 
      industry: 'Technology',
      employees: 250,
      location: 'San Francisco, CA',
      email: 'contact@acme.com',
      status: 'active',
      projects: 12
    },
    { 
      id: 2, 
      name: 'TechStart Inc', 
      industry: 'Software',
      employees: 50,
      location: 'Austin, TX',
      email: 'hello@techstart.com',
      status: 'active',
      projects: 5
    },
    { 
      id: 3, 
      name: 'Global Solutions Ltd', 
      industry: 'Consulting',
      employees: 500,
      location: 'New York, NY',
      email: 'info@globalsolutions.com',
      status: 'inactive',
      projects: 8
    },
    { 
      id: 4, 
      name: 'Innovation Labs', 
      industry: 'Research',
      employees: 120,
      location: 'Boston, MA',
      email: 'contact@innovlabs.com',
      status: 'active',
      projects: 15
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organization network and partnerships
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => o.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active partnerships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, o) => sum + o.employees, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all orgs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, o) => sum + o.projects, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Collaborative projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            View and manage your organization network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-medium text-base">{org.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {org.industry}
                      </Badge>
                    </div>
                    <Badge className={
                      org.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }>
                      {org.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{org.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{org.employees.toLocaleString()} employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{org.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{org.projects} projects</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Mail className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
