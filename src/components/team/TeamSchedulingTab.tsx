import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, Clock, Plus, Users, Settings, Edit, Trash2, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { DriverWorkingHoursSection } from '@/components/settings/DriverWorkingHoursSection';

export function TeamSchedulingTab() {
  const [showDriverHours, setShowDriverHours] = useState(false);
  const [view, setView] = useState('week'); // week, month, template
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shiftTemplateModalOpen, setShiftTemplateModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  // Mock data
  const teamMembers = [
    { id: '1', name: 'John Smith', role: 'Driver', team: 'Drivers', status: 'available' },
    { id: '2', name: 'Sarah Johnson', role: 'Admin', team: 'Office', status: 'available' },
    { id: '3', name: 'Mike Wilson', role: 'Driver', team: 'Drivers', status: 'unavailable' },
    { id: '4', name: 'Emily Davis', role: 'Warehouse Tech', team: 'Warehouse', status: 'available' }
  ];

  const shiftTemplates = [
    { id: '1', name: 'Morning Route', start: '08:00', end: '16:00', type: 'Driver', description: 'Standard morning delivery route' },
    { id: '2', name: 'Evening Clean', start: '17:00', end: '21:00', type: 'Driver', description: 'Evening service and maintenance' },
    { id: '3', name: 'Warehouse Day', start: '09:00', end: '17:00', type: 'Warehouse', description: 'Warehouse operations and inventory' }
  ];

  const weeklySchedule = [
    { id: '1', date: '2024-01-15', shifts: [
      { id: 's1', templateId: '1', assignedTo: '1', status: 'confirmed', conflicts: [] },
      { id: 's2', templateId: '3', assignedTo: '4', status: 'pending', conflicts: [] }
    ]},
    { id: '2', date: '2024-01-16', shifts: [
      { id: 's3', templateId: '1', assignedTo: '1', status: 'confirmed', conflicts: [] },
      { id: 's4', templateId: '2', assignedTo: '3', status: 'conflict', conflicts: ['unavailable'] }
    ]}
  ];

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    // Handle shift reassignment logic here
    console.log('Reassigning shift:', { source, destination, draggableId });
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'default',
      'pending': 'secondary',
      'conflict': 'destructive'
    };
    return colors[status] || 'outline';
  };

  if (showDriverHours) {
    return (
      <DriverWorkingHoursSection onBack={() => setShowDriverHours(false)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Scheduling</h2>
          <p className="text-muted-foreground">Manage shifts, assignments, and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShiftTemplateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Confirmed Shifts</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Conflicts</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Available</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {view === 'template' ? (
        // Shift Templates View
        <Card>
          <CardHeader>
            <CardTitle>Shift Templates</CardTitle>
            <CardDescription>Create and manage reusable shift patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shiftTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.type}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{template.start} - {template.end}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Button variant="outline" className="w-full mt-3" onClick={() => setAssignmentModalOpen(true)}>
                      Assign to Date
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Calendar View
        <DragDropContext onDragEnd={onDragEnd}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {view === 'week' ? 'Weekly Schedule' : 'Monthly Schedule'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowDriverHours(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Working Hours
                  </Button>
                  <Button onClick={() => setAssignmentModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Shift
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium p-2 bg-muted rounded">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day, index) => (
                  <Droppable key={day.toISOString()} droppableId={`day-${index}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[120px] p-2 border rounded-lg ${
                          snapshot.isDraggingOver ? 'bg-primary/5 border-primary' : 'border-border'
                        }`}
                      >
                        <div className="text-sm font-medium mb-2">
                          {day.getDate()}
                        </div>
                        
                        {/* Sample shifts for demonstration */}
                        {index < 2 && shiftTemplates.slice(0, index + 1).map((shift, shiftIndex) => (
                          <Draggable
                            key={`${shift.id}-${index}`}
                            draggableId={`${shift.id}-${index}`}
                            index={shiftIndex}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 mb-2 rounded text-xs ${
                                  snapshot.isDragging ? 'opacity-50' : ''
                                } bg-primary/10 border border-primary/20`}
                              >
                                <div className="font-medium truncate">{shift.name}</div>
                                <div className="text-muted-foreground">{shift.start}-{shift.end}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">JS</AvatarFallback>
                                  </Avatar>
                                  <Badge variant="outline" className="text-xs">
                                    Confirmed
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </CardContent>
          </Card>
        </DragDropContext>
      )}

      {/* Shift Template Modal */}
      <Dialog open={shiftTemplateModalOpen} onOpenChange={setShiftTemplateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Shift Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="e.g., Morning Route" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" defaultValue="08:00" />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" defaultValue="16:00" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this shift..." />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShiftTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShiftTemplateModalOpen(false)}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" />
            </div>
            
            <div className="space-y-2">
              <Label>Shift Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.start}-{template.end})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.filter(member => member.status === 'available').map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAssignmentModalOpen(false)}>
                Assign Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}