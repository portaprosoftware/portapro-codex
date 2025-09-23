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
  Settings
} from 'lucide-react';

export const CustomerPortalMockup: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">ABC Construction • Customer Portal</h1>
          </div>
          <div className="flex items-center gap-2">
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
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-600" />
                      Notifications
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Service scheduled</p>
                      <p className="text-xs text-gray-700">Tomorrow at 9:00 AM</p>
                    </div>
                    
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Invoice ready</p>
                      <p className="text-xs text-gray-700">Ready for review</p>
                    </div>
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
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Downtown Office Complex</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      123 Main St, Downtown
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    2x Standard Units
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Next service: Tomorrow</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Riverside Construction Site</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      456 River Rd, Westside
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    4x Standard Units
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Next service: Friday</p>
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