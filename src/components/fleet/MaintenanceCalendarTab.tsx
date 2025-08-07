import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";

export const MaintenanceCalendarTab: React.FC = () => {
  // Mock calendar data - in real implementation this would come from maintenance_records
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Mock maintenance events
  const maintenanceEvents = {
    15: [
      { id: 1, vehicle: "Truck 101", task: "Oil Change", time: "09:00", priority: "medium", technician: "Mike J." },
      { id: 2, vehicle: "Van 205", task: "Tire Rotation", time: "14:00", priority: "low", technician: "Sarah D." }
    ],
    18: [
      { id: 3, vehicle: "Truck 103", task: "Brake Inspection", time: "10:00", priority: "high", technician: "Mike J." }
    ],
    22: [
      { id: 4, vehicle: "Van 207", task: "DOT Inspection", time: "08:00", priority: "critical", technician: "Sarah D." },
      { id: 5, vehicle: "Truck 102", task: "Oil Change", time: "11:00", priority: "medium", technician: "Mike J." }
    ],
    25: [
      { id: 6, vehicle: "Van 206", task: "Transmission Service", time: "13:00", priority: "high", technician: "Sarah D." }
    ]
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="bg-white rounded-lg border shadow-sm">
        <CardHeader className="px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Maintenance Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-lg min-w-[140px] text-center">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <Button variant="outline" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  <SelectItem value="mike">Mike Johnson</SelectItem>
                  <SelectItem value="sarah">Sarah Davis</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </div>
          </div>
          <CardDescription className="mt-2">
            Drag and drop to reschedule maintenance tasks or assign to different technicians
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-white rounded-lg border shadow-sm">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[700px]">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-center font-medium text-gray-600 bg-gray-50 rounded-t-lg">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-200" />
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear();
                const events = maintenanceEvents[day] || [];
                
                return (
                  <div 
                    key={day} 
                    className={`h-32 border border-gray-200 p-2 bg-white hover:bg-gray-50 cursor-pointer ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {events.slice(0, 2).map((event) => (
                        <div 
                          key={event.id}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: getPriorityColor(event.priority).split(' ')[0].replace('bg-', '#') + '20' }}
                        >
                          <div className="font-medium truncate">{event.vehicle}</div>
                          <div className="text-gray-600 truncate">{event.task}</div>
                          <div className="text-gray-500">{event.time}</div>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technician Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Technician Availability</CardTitle>
            <CardDescription>
              Current workload and availability for each technician
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-green-900">Mike Johnson</h4>
                  <p className="text-sm text-green-600">Senior Technician</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0">Available</Badge>
                  <p className="text-sm text-gray-600">3 jobs this week</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-yellow-900">Sarah Davis</h4>
                  <p className="text-sm text-yellow-600">Maintenance Specialist</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-yellow-100 text-yellow-800 mb-1">Busy</Badge>
                  <p className="text-sm text-gray-600">6 jobs this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>
              Critical maintenance tasks due soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Van 207 - DOT Inspection</h4>
                  <p className="text-sm text-red-600">Due in 2 days</p>
                </div>
                <Badge className="bg-red-500 text-white">Critical</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-orange-900">Truck 103 - Brake Inspection</h4>
                  <p className="text-sm text-orange-600">Due in 4 days</p>
                </div>
                <Badge className="bg-orange-500 text-white">High</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-yellow-900">Van 206 - Transmission Service</h4>
                  <p className="text-sm text-yellow-600">Due in 1 week</p>
                </div>
                <Badge className="bg-yellow-500 text-white">Medium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};