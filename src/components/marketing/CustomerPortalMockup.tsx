import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Bell,
  Settings,
  X
} from 'lucide-react';

export const CustomerPortalMockup: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="space-y-3">
          {/* Company Name Row */}
          <div className="flex items-center justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">
                ABC Construction
                <span className="hidden md:inline"> • Customer Portal</span>
              </h1>
            </div>
            {/* Icons on desktop - right aligned */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {/* Notification badge */}
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-sm text-white font-bold">2</span>
                  </div>
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-600" />
                          Notifications
                        </h3>
                        <button 
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">Service scheduled</p>
                        <p className="text-xs text-gray-700">Tomorrow at 9:00 AM</p>
                      </div>
                      
                      <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-left group">
                        <p className="text-sm font-medium text-blue-900 group-hover:text-blue-800">Invoice ready</p>
                        <p className="text-xs text-blue-700 group-hover:text-blue-600">Ready for review</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Settings className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">ABC Construction</span>
              </div>
            </div>
          </div>
          
          {/* Icons Row on Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                {/* Notification badge */}
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-sm text-white font-bold">2</span>
                </div>
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-600" />
                        Notifications
                      </h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Service scheduled</p>
                      <p className="text-xs text-gray-700">Tomorrow at 9:00 AM</p>
                    </div>
                    
                    <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-left group">
                      <p className="text-sm font-medium text-blue-900 group-hover:text-blue-800">Invoice ready</p>
                      <p className="text-xs text-blue-700 group-hover:text-blue-600">Ready for review</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Settings className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">ABC Construction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Services Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Services */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Active Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-100 rounded-lg border border-gray-200 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">Downtown Office Complex</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">123 Main St, Downtown</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 text-xs whitespace-nowrap">
                    2x Standard Units
                  </Badge>
                  <p className="text-xs text-gray-500 whitespace-nowrap">Next: Tomorrow</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-100 rounded-lg border border-gray-200 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">Riverside Construction Site</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">456 River Rd, Westside</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-xs whitespace-nowrap">
                    4x Standard Units
                  </Badge>
                  <p className="text-xs text-gray-500 whitespace-nowrap">Next: Friday</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Service completed</p>
                  <p className="text-xs text-gray-600">Downtown Office Complex • 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Invoice generated</p>
                  <p className="text-xs text-gray-600">#INV-2024-0089 • Yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Summary */}
        <div className="space-y-6">
          {/* Account Summary */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">$1,247.50</p>
                <p className="text-sm text-gray-600">Current balance</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This month</span>
                  <span className="font-medium text-gray-900">$3,200.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last payment</span>
                  <span className="font-medium text-gray-900">$2,150.00</span>
                </div>
              </div>
              
              <Button className="w-full" size="sm">
                Make Payment
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Request Service
              </Button>
              
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View Invoices
              </Button>
              
              <Button variant="outline" className="w-full justify-start" size="sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};