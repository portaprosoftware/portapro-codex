import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, BarChart3, Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Jobs: React.FC = () => {
  const [activeView, setActiveView] = useState<"calendar" | "dashboard" | "map">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 17)); // July 17, 2025

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Mock job data
  const mockJobs = [
    {
      id: 'DEL-024',
      type: 'delivery',
      customer: 'Hickory Hollow Farm',
      date: 'Jul 17, 2025',
      driver: 'Grady Green',
      status: 'assigned'
    },
    {
      id: 'SVC-041',
      type: 'service',
      customer: 'BlueWave Festival',
      date: 'Jul 17, 2025',
      driver: 'Jason Wells',
      status: 'assigned'
    }
  ];

  const renderNavPills = () => (
    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
      <Button
        variant={activeView === "calendar" ? "default" : "ghost"}
        onClick={() => setActiveView("calendar")}
        className="flex items-center gap-2 px-4 py-2"
      >
        <Calendar className="h-4 w-4" />
        Calendar
      </Button>
      <Button
        variant={activeView === "dashboard" ? "default" : "ghost"}
        onClick={() => setActiveView("dashboard")}
        className="flex items-center gap-2 px-4 py-2"
      >
        <BarChart3 className="h-4 w-4" />
        Dashboard
      </Button>
      <Button
        variant={activeView === "map" ? "default" : "ghost"}
        onClick={() => setActiveView("map")}
        className="flex items-center gap-2 px-4 py-2"
      >
        <MapPin className="h-4 w-4" />
        Map
      </Button>
    </div>
  );

  const renderCalendarView = () => (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Calendar View</h2>
          <p className="text-gray-600">Schedule and manage job assignments</p>
        </div>
        <Button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer name or job ID..."
                className="w-80"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Filters</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="grady">Grady Green</SelectItem>
                  <SelectItem value="jason">Jason Wells</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="standard">Standard Unit</SelectItem>
                  <SelectItem value="deluxe">Deluxe Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variation</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Variations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Variations</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Going Out */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Going Out</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3 py-1 bg-white/20 rounded">
                  {formatMonth(currentDate)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {mockJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {job.type === 'delivery' ? (
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        </div>
                      )}
                      <span className="font-medium text-gray-900 capitalize">{job.type}</span>
                    </div>
                    <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                      {job.status === 'assigned' ? 'Assigned' : job.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Job #:</strong> {job.id}</div>
                    <div><strong>Customer:</strong> {job.customer}</div>
                    <div><strong>Date:</strong> {job.date}</div>
                    <div><strong>Driver:</strong> {job.driver}</div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Tap to assign/change driver or time of job
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coming Back */}
        <Card className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Coming Back</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3 py-1 bg-white/20 rounded">
                  {formatMonth(currentDate)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>No pickups or returns scheduled for this date</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Jobs Dashboard</h2>
        <p className="text-gray-600">Overview of job statistics and metrics</p>
      </div>
      <div className="text-center py-20 text-gray-500">
        Dashboard view coming soon...
      </div>
    </div>
  );

  const renderMapView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Jobs Map</h2>
        <p className="text-gray-600">Geographic view of job locations</p>
      </div>
      <div className="text-center py-20 text-gray-500">
        Map view coming soon...
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Navigation Pills */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600">Schedule and manage job assignments</p>
          </div>
          {renderNavPills()}
        </div>

        {/* Content based on active view */}
        {activeView === "calendar" && renderCalendarView()}
        {activeView === "dashboard" && renderDashboardView()}
        {activeView === "map" && renderMapView()}
      </div>
    </Layout>
  );
};

export default Jobs;