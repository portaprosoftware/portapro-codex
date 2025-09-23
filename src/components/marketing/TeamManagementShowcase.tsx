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
  { id: 1, driver: 'Sarah Klein', time: '8:00 AM - 4:00 PM', status: 'in-progress' },
  { id: 2, driver: 'Mike Johnson', time: '12:00 PM - 8:00 PM', status: 'scheduled' },
  { id: 3, driver: 'David Rodriguez', time: '2:00 PM - 10:00 PM', status: 'scheduled' }
];

const mockTimeOffRequests = [
  { id: 1, driver: 'Mike Johnson', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], type: 'Vacation', status: 'pending' },
  { id: 2, driver: 'Sarah Klein', date: new Date().toISOString().split('T')[0], type: 'Sick', status: 'approved' }
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
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="truncate">Scheduling Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-3 pt-0">
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
                <CardContent className="p-2 sm:p-3">
                  <div className="space-y-2">
                    {mockShifts.map((shift) => (
                      <div key={shift.id} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{shift.driver}</p>
                          <p className="text-xs text-gray-600">{shift.time}</p>
                        </div>
                         <Badge 
                           variant={shift.status === 'in-progress' ? 'default' : 'secondary'} 
                           className={`text-xs ${shift.status === 'in-progress' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0' : ''}`}
                         >
                           {shift.status === 'in-progress' ? 'Active' : 'Scheduled'}
                         </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Schedule Grid */}
            <SchedulingGraphic />
          </div>
        );

      case 'time-off':
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid md:grid-cols-2 gap-2 sm:gap-4">
              {/* Time Off Features */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="truncate">Time Off Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-3 pt-0">
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
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="truncate">Recent Requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="space-y-2">
                    {mockTimeOffRequests.map((request) => (
                      <div key={request.id} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{request.driver}</p>
                          <p className="text-xs text-gray-600">{request.date} - {request.type}</p>
                        </div>
                        <Badge 
                          variant="default" 
                          className={`text-xs ${
                            request.status === 'approved' 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0' 
                              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0'
                          }`}
                        >
                          {request.status === 'approved' ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Off Management with Calendar */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base sm:text-lg">Time Off Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 pt-0">
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
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="truncate">Compliance Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-3 pt-0">
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
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="truncate">Training Interface</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
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
              <CardHeader className="pb-0">
                <CardTitle className="text-base sm:text-lg">Credential Status</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 pt-0">
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
              <CardContent className="p-2 sm:p-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-lg">
                      {mockDriverProfile.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg">{mockDriverProfile.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{mockDriverProfile.email}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{mockDriverProfile.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xs border-0">
                      {mockDriverProfile.role}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xs border-0">
                      {mockDriverProfile.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-2 sm:gap-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="truncate">Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">License Status</span>
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xs border-0">Current</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Medical Card</span>
                      <Badge variant="destructive" className="text-xs">Not Set</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Training Records</span>
                      <Badge variant="default" className="text-xs">0 Records</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Working Days</span>
                      <Badge variant="default" className="text-xs">5 Days/Week</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Overview */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    <span className="truncate">Compliance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                    <div className="text-base sm:text-xl font-bold text-red-600">20%</div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">Overall Compliance</p>
                      <p className="text-xs text-gray-600">1 of 5 items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
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
              <CardHeader className="pb-0">
                <CardTitle className="text-sm sm:text-base">Profile Management Features</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                  <div className="text-center p-2 sm:p-3 rounded-lg border">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-blue-600" />
                    <p className="text-xs font-medium">Overview</p>
                    <p className="text-xs text-gray-600 hidden sm:block">Stats & Activity</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg border">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-green-600" />
                    <p className="text-xs font-medium">Credentials</p>
                    <p className="text-xs text-gray-600 hidden sm:block">License & Permits</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg border">
                    <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-purple-600" />
                    <p className="text-xs font-medium">Training</p>
                    <p className="text-xs text-gray-600 hidden sm:block">Certifications</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg border">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-red-600" />
                    <p className="text-xs font-medium">Compliance</p>
                    <p className="text-xs text-gray-600 hidden sm:block">Status Tracking</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg border col-span-2 sm:col-span-1">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-orange-600" />
                    <p className="text-xs font-medium">Documents</p>
                    <p className="text-xs text-gray-600 hidden sm:block">File Management</p>
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-gray-900">4 items need immediate attention:</p>
                      <ul className="mt-1 space-y-1 text-gray-800">
                        <li>• Training Docs - Not provided</li>
                        <li>• Medical Certificate - Not provided</li>
                        <li className="sm:block hidden">• Safety Training - Not provided</li>
                        <li className="sm:block hidden">• DOT Compliance - Not provided</li>
                        <li className="sm:hidden">• +2 more items</li>
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
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
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

        {/* Interactive Text */}
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">Interactive: Click the tabs below to explore.</p>
        </div>

        {/* Main Dashboard */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold truncate">Team Management Dashboard</h3>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-2 sm:p-3">
            {/* Mobile & Tablet Dropdown Navigation */}
            <div className="block lg:hidden mb-2">
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white text-sm shadow-sm z-50 relative"
              >
                {teamTabs.map((tab) => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex flex-wrap items-center gap-1 mb-2 sm:mb-3" aria-label="Team management tabs">
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
                  <span>{tab.label}</span>
                </Button>
              ))}
            </nav>

            {/* Tab Content */}
            <div className="min-h-[250px] sm:min-h-[300px] lg:min-h-[400px]">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};