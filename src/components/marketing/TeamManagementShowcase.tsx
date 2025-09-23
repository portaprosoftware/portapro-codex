import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { 
  CalendarClock, 
  Calendar, 
  Shield, 
  Users, 
  ClipboardList, 
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Camera,
  Smartphone,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { SchedulingGraphic } from '@/components/ui/SchedulingGraphic';
import { TimeOffCalendarView } from '@/components/team/enhanced/TimeOffCalendarView';

const teamTabs = [
  { key: 'scheduling', label: 'Scheduling & Availability', icon: CalendarClock },
  { key: 'time-off', label: 'Time Off & Compliance', icon: Clock },
  { key: 'training', label: 'Training & Certifications', icon: Shield },
  { key: 'driver-profiles', label: 'Driver Profiles', icon: Users }
];

const mockShifts = [
  { id: 1, driver: 'Mike Johnson', time: '7:00 AM - 3:00 PM', status: 'scheduled' },
  { id: 2, driver: 'Sarah Chen', time: '8:00 AM - 4:00 PM', status: 'in-progress' },
  { id: 3, driver: 'David Rodriguez', time: '2:00 PM - 10:00 PM', status: 'scheduled' }
];

const mockTimeOffRequests = [
  { id: 1, driver: 'Mike Johnson', date: '2024-01-15', type: 'Vacation', status: 'pending' },
  { id: 2, driver: 'Sarah Chen', date: '2024-01-20', type: 'Sick', status: 'approved' }
];

const mockCredentials = [
  { id: 1, driver: 'Mike Johnson', type: 'CDL License', expires: '2024-02-15', status: 'warning' },
  { id: 2, driver: 'David Rodriguez', type: 'Medical Card', expires: '2024-01-30', status: 'critical' },
  { id: 3, driver: 'Sarah Chen', type: 'Safety Training', expires: '2024-03-10', status: 'good' }
];

const mockDriverProfile = {
  name: 'John Doe',
  email: 'tylertdouglas@outlook.com',
  phone: '3305627425',
  initials: 'JD',
  role: 'Driver',
  status: 'Active'
};

export const TeamManagementShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('scheduling');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scheduling':
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid md:grid-cols-2 gap-2 sm:gap-4">
              {/* Scheduling Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="truncate">Scheduling Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CalendarClock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Weekly drag-and-drop board</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Reusable shift templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Conflict detection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Driver availability tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Shifts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CalendarClock className="w-5 h-5 text-green-600" />
                    <span className="truncate">Today's Shifts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="space-y-2">
                    {mockShifts.map((shift) => (
                      <div key={shift.id} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{shift.driver}</p>
                          <p className="text-xs text-gray-600">{shift.time}</p>
                        </div>
                        <Badge variant={shift.status === 'in-progress' ? 'default' : 'secondary'} className="text-xs">
                          {shift.status === 'in-progress' ? 'Active' : 'Scheduled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Schedule Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Weekly Schedule Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="h-64 sm:h-80">
                  <SchedulingGraphic />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'time-off':
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid md:grid-cols-2 gap-2 sm:gap-4">
              {/* Time Off Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="truncate">Time Off Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Full-day, AM/PM, custom times</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Approval workflow</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Shift impact visibility</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Notes & documentation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="truncate">Recent Requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="space-y-2">
                    {mockTimeOffRequests.map((request) => (
                      <div key={request.id} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{request.driver}</p>
                          <p className="text-xs text-gray-600">{request.date} - {request.type}</p>
                        </div>
                        <Badge variant={request.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Time Off Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="flex justify-center">
                  <div className="w-full max-w-sm">
                    <AspectRatio ratio={1}>
                      <div className="h-full">
                        <TimeOffCalendarView compact />
                      </div>
                    </AspectRatio>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'training':
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid md:grid-cols-2 gap-2 sm:gap-4">
              {/* Compliance Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="truncate">Compliance Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Auto-expiration reminders</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Camera className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Document attachments</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Certification tracking</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Role-based requirements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Training Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="truncate">Training Interface</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src="/lovable-uploads/0311afae-06cb-4157-9104-e58e14de00b0.png" 
                      alt="Training Requirements management interface" 
                      className="w-full h-32 sm:h-40 object-cover object-center"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credential Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Credential Status</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="space-y-2">
                  {mockCredentials.map((credential) => (
                    <div key={credential.id} className="flex justify-between items-center p-2 rounded bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{credential.driver}</p>
                        <p className="text-xs text-gray-600">{credential.type} - Expires {credential.expires}</p>
                      </div>
                      <Badge 
                        variant={credential.status === 'critical' ? 'destructive' : credential.status === 'warning' ? 'secondary' : 'default'} 
                        className="text-xs"
                      >
                        {credential.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'driver-profiles':
        return (
          <div className="space-y-2 sm:space-y-3">
            {/* Driver Profile Header */}
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {mockDriverProfile.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{mockDriverProfile.name}</h3>
                      <p className="text-sm text-gray-600">{mockDriverProfile.email}</p>
                      <p className="text-sm text-gray-600">{mockDriverProfile.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {mockDriverProfile.role}
                    </Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {mockDriverProfile.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-2 sm:gap-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="truncate">Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">License Status</span>
                      <Badge variant="destructive" className="text-xs">Not Set</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medical Card</span>
                      <Badge variant="destructive" className="text-xs">Not Set</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Training Records</span>
                      <Badge variant="default" className="text-xs">0 Records</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Working Days</span>
                      <Badge variant="default" className="text-xs">5 Days/Week</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span className="truncate">Compliance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-16 h-16">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-red-600">20%</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">Overall Compliance</p>
                      <p className="text-xs text-gray-600">1 of 5 items</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Compliant: 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span>Missing: 4</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Sections Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Profile Management Features</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="text-center p-3 rounded-lg border">
                    <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-xs font-medium">Overview</p>
                    <p className="text-xs text-gray-600">Stats & Activity</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-xs font-medium">Credentials</p>
                    <p className="text-xs text-gray-600">License & Permits</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <ClipboardList className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-xs font-medium">Training</p>
                    <p className="text-xs text-gray-600">Certifications</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-red-600" />
                    <p className="text-xs font-medium">Compliance</p>
                    <p className="text-xs text-gray-600">Status Tracking</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-xs font-medium">Documents</p>
                    <p className="text-xs text-gray-600">File Management</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800">4 items need immediate attention:</p>
                      <ul className="mt-1 space-y-1 text-blue-700">
                        <li>• Driver License - Not provided</li>
                        <li>• Medical Certificate - Not provided</li>
                        <li>• Safety Training - Not provided</li>
                        <li>• DOT Compliance - Not provided</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="team-management" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Team Management & Scheduling</h2>
          <p className="text-lg text-muted-foreground">Everything you need to manage people, time, and compliance</p>
        </div>

        {/* Team KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard 
            title="Shifts Today" 
            value={8} 
            icon={CalendarClock} 
            gradientFrom="hsl(142, 76%, 36%)" 
            gradientTo="hsl(142, 76%, 25%)" 
            iconBg="hsl(142, 76%, 36%)" 
            subtitle={<span className="text-muted-foreground">Scheduled shifts</span>} 
          />
          <StatCard 
            title="Approved Time Off" 
            value={1} 
            icon={Calendar} 
            gradientFrom="hsl(var(--destructive))" 
            gradientTo="hsl(var(--destructive) / 0.7)" 
            iconBg="hsl(var(--destructive))" 
            subtitle={<span className="text-muted-foreground">Today</span>} 
          />
          <StatCard 
            title="Expiring Credentials" 
            value={3} 
            icon={Shield} 
            gradientFrom="hsl(45, 93%, 55%)" 
            gradientTo="hsl(45, 93%, 45%)" 
            iconBg="hsl(45, 93%, 55%)" 
            subtitle={<span className="text-muted-foreground">Next 30 days</span>} 
          />
        </div>

        {/* Main Dashboard */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold truncate">Team Management Dashboard</h3>
                <p className="text-sm text-white/80">Interactive demo of scheduling, time-off, and compliance features</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-2 sm:p-3">
            <nav className="flex flex-wrap items-center gap-1 mb-2 sm:mb-3" aria-label="Team management tabs">
              {teamTabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 text-xs sm:text-sm ${
                    activeTab === tab.key 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </Button>
              ))}
            </nav>

            {/* Tab Content */}
            <div className="min-h-[300px] sm:min-h-[400px]">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};