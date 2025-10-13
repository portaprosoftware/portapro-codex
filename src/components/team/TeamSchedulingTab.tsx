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
import { useShiftTemplates, useDriverShiftsForWeek, useAssignShift, useMoveShift, useCreateShiftTemplate, useDeleteShiftTemplate } from '@/hooks/useScheduling';
import { useDriverDirectory } from '@/hooks/useDirectory';
import { format } from 'date-fns';

export function TeamSchedulingTab() {
  const [showDriverHours, setShowDriverHours] = useState(false);
  const [view, setView] = useState('week'); // week, month, template
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shiftTemplateModalOpen, setShiftTemplateModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  // Data from Supabase
  const { data: driverDirectory = [] } = useDriverDirectory();
  const driverByClerk = React.useMemo(() => {
    const map: Record<string, { name: string; initials: string }> = {};
    driverDirectory.forEach((d: any) => {
      const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.email || 'Driver';
      const initials = `${(d.first_name?.[0] ?? 'D')}${(d.last_name?.[0] ?? '')}`.toUpperCase();
      if (d.clerk_user_id) map[d.clerk_user_id] = { name, initials };
    });
    return map;
  }, [driverDirectory]);

  const { data: templates = [] } = useShiftTemplates();
  const templateById = React.useMemo(() => {
    const m: Record<string, any> = {};
    (templates || []).forEach((t: any) => { m[t.id] = t; });
    return m;
  }, [templates]);
  const { data: weekShifts = [] } = useDriverShiftsForWeek(selectedDate);
  const createTemplate = useCreateShiftTemplate();
  const deleteTemplate = useDeleteShiftTemplate();
  const assignShift = useAssignShift();
  const moveShift = useMoveShift();

  // Quick stats from real data
  const confirmedCount = (weekShifts as any[]).filter((s: any) => ['confirmed', 'scheduled'].includes(s.status)).length;
  const pendingCount = (weekShifts as any[]).filter((s: any) => s.status === 'pending').length;

  const timeToMinutes = (t: string) => {
    const [h, m] = String(t).split(':');
    return (parseInt(h || '0', 10) * 60) + parseInt(m || '0', 10);
  };

  const conflictCount = React.useMemo(() => {
    const byKey: Record<string, any[]> = {};
    (weekShifts as any[]).forEach((s: any) => {
      if (!s.driver_clerk_id) return;
      const key = `${s.driver_clerk_id}-${s.shift_date}`;
      (byKey[key] ||= []).push(s);
    });
    let conflicts = 0;
    Object.values(byKey).forEach((list: any[]) => {
      list.sort((a: any, b: any) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (timeToMinutes(list[i].end_time) > timeToMinutes(list[j].start_time)) {
            conflicts++;
          } else {
            break;
          }
        }
      }
    });
    return conflicts;
  }, [weekShifts]);

  const assignedDrivers = new Set((weekShifts as any[]).map((s: any) => s.driver_clerk_id).filter(Boolean));
  const availableCount = Math.max((driverDirectory || []).filter((d: any) => d.clerk_user_id).length - assignedDrivers.size, 0);

  // Template form state
  const [templateName, setTemplateName] = useState("");
  const [templateStart, setTemplateStart] = useState("08:00");
  const [templateEnd, setTemplateEnd] = useState("16:00");
  const [templateType, setTemplateType] = useState("driver");
  const [templateDescription, setTemplateDescription] = useState("");

  // Assignment form state
  const [assignmentDateStr, setAssignmentDateStr] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [assignmentTemplateId, setAssignmentTemplateId] = useState<string | undefined>(undefined);
  const [assignmentDriverClerkId, setAssignmentDriverClerkId] = useState<string | undefined>(undefined);

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const onDragEnd = (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const [, dayIndexStr] = destination.droppableId.split('-');
    const dayIndex = parseInt(dayIndexStr, 10);
    const days = getWeekDays();
    const newDate = days[dayIndex];
    if (!newDate) return;
    moveShift.mutate({ shift_id: draggableId, new_date: format(newDate, 'yyyy-MM-dd') });
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
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-6">
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
                    <p className="text-2xl font-bold">{confirmedCount}</p>
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
                    <p className="text-2xl font-bold">{pendingCount}</p>
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
                    <p className="text-2xl font-bold">{conflictCount}</p>
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
                    <p className="text-2xl font-bold">{availableCount}</p>
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
              {templates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.shift_type}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={async () => {
                          await createTemplate.mutateAsync({
                            name: `${template.name} (Copy)`,
                            shift_type: template.shift_type,
                            description: template.description,
                            start_time: template.start_time,
                            end_time: template.end_time,
                          } as any);
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTemplate.mutate(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{String(template.start_time).slice(0,5)} - {String(template.end_time).slice(0,5)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Button variant="outline" className="w-full mt-3" onClick={() => { setAssignmentTemplateId(template.id); setAssignmentModalOpen(true); }}>
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
                        
                        {/* Render real shifts for this day */}
                        {(() => {
                          const dayStr = format(day, 'yyyy-MM-dd');
                          const shiftsForDay = (weekShifts as any[]).filter((s: any) => s.shift_date === dayStr);
                          return shiftsForDay.map((shift: any, shiftIndex: number) => (
                            <Draggable key={shift.id} draggableId={shift.id} index={shiftIndex}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-2 mb-2 rounded text-xs ${
                                    snapshot.isDragging ? 'opacity-50' : ''
                                  } bg-primary/10 border border-primary/20`}
                                >
                                  <div className="font-medium truncate">{templateById[shift.template_id]?.name || 'Shift'}</div>
                                  <div className="text-muted-foreground">{String(shift.start_time).slice(0,5)}-{String(shift.end_time).slice(0,5)}</div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-xs">{driverByClerk[shift.driver_clerk_id]?.initials || 'DR'}</AvatarFallback>
                                    </Avatar>
                                    <Badge variant="outline" className="text-xs">
                                      {shift.status}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ));
                        })()}
                        
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
              <Input placeholder="e.g., Morning Route" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={templateStart} onChange={(e) => setTemplateStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={templateEnd} onChange={(e) => setTemplateEnd(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
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
              <Textarea placeholder="Brief description of this shift..." value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShiftTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                await createTemplate.mutateAsync({
                  name: templateName,
                  shift_type: templateType,
                  description: templateDescription,
                  start_time: `${templateStart}:00`,
                  end_time: `${templateEnd}:00`,
                } as any);
                setShiftTemplateModalOpen(false);
              }}>
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
              <Input type="date" value={assignmentDateStr} onChange={(e) => setAssignmentDateStr(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Shift Template</Label>
              <Select value={assignmentTemplateId} onValueChange={setAssignmentTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({String(template.start_time).slice(0,5)}-{String(template.end_time).slice(0,5)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignmentDriverClerkId} onValueChange={setAssignmentDriverClerkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {driverDirectory.map((d: any) => {
                    const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.email || 'Driver';
                    return (
                      <SelectItem key={d.clerk_user_id ?? d.id} value={d.clerk_user_id ?? ''}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!assignmentDriverClerkId || !assignmentDateStr) return;
                await assignShift.mutateAsync({
                  driver_clerk_id: assignmentDriverClerkId,
                  date: assignmentDateStr,
                  template_id: assignmentTemplateId,
                });
                setAssignmentModalOpen(false);
              }}>
                Assign Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}