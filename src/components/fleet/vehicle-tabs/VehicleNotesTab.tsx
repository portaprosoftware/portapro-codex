import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, AlertCircle, MoreVertical, Search, CalendarIcon, X } from 'lucide-react';
import { useVehicleNotes } from '@/hooks/useVehicleNotes';
import { Loader2 } from 'lucide-react';
import { EditVehicleNotesModal } from '@/components/customers/EditVehicleNotesModal';
import { ViewNoteModal } from '@/components/customers/ViewNoteModal';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface VehicleNotesTabProps {
  vehicleId: string;
}

// Vehicle-specific tags
const VEHICLE_TAGS = [
  'Maintenance scheduled',
  'Maintenance completed',
  'Inspection due',
  'Inspection completed',
  'Repair required',
  'Repair completed',
  'DVIR submitted',
  'Out of service',
  'Back in service',
  'Accident/incident reported',
  'Cleaning required',
  'Compliance issue',
];

// General tags
const GENERAL_TAGS = [
  'Completed',
  'In progress',
  'Follow-up required',
  'Needs attention',
  'Scheduled',
  'Resolved',
  'Internal note',
  'Customer request related',
];

export function VehicleNotesTab({ vehicleId }: VehicleNotesTabProps) {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useVehicleNotes(vehicleId);
  
  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<any>(null);

  // Filter states
  const [selectedVehicleTag, setSelectedVehicleTag] = useState<string>('all');
  const [selectedGeneralTag, setSelectedGeneralTag] = useState<string>('all');
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Handlers
  const handleAddNote = () => {
    setEditingNote(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setIsAddEditModalOpen(true);
  };

  const handleViewNote = (note: any) => {
    setSelectedNote(note);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (note: any) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNote) {
      deleteNote(selectedNote.id);
    }
  };

  const handleSaveNote = (noteData: any) => {
    if (editingNote) {
      updateNote({ noteId: editingNote.id, noteData });
    } else {
      addNote(noteData);
    }
    setIsAddEditModalOpen(false);
  };

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Filter by vehicle tag
      if (selectedVehicleTag !== 'all') {
        if (!note.tags?.includes(selectedVehicleTag)) return false;
      }

      // Filter by general tag
      if (selectedGeneralTag !== 'all') {
        if (!note.tags?.includes(selectedGeneralTag)) return false;
      }

      // Filter by important flag
      if (showImportantOnly && !note.is_important) return false;

      // Filter by search term
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(search);
        const contentMatch = note.note_text.toLowerCase().includes(search);
        const tagMatch = note.tags?.some(tag => tag.toLowerCase().includes(search));
        
        if (!titleMatch && !contentMatch && !tagMatch) {
          return false;
        }
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        const noteDate = new Date(note.created_at);
        if (dateFrom && noteDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (noteDate > endOfDay) return false;
        }
      }

      return true;
    });
  }, [notes, selectedVehicleTag, selectedGeneralTag, showImportantOnly, searchTerm, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vehicle Notes</h3>
          <p className="text-sm text-muted-foreground">
            Track maintenance, inspections, and important vehicle information
          </p>
        </div>
        <Button onClick={handleAddNote} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Tag</Label>
              <Select value={selectedVehicleTag} onValueChange={setSelectedVehicleTag}>
                <SelectTrigger>
                  <SelectValue placeholder="All vehicle tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vehicle tags</SelectItem>
                  {VEHICLE_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>General Tag</Label>
              <Select value={selectedGeneralTag} onValueChange={setSelectedGeneralTag}>
                <SelectTrigger>
                  <SelectValue placeholder="All general tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All general tags</SelectItem>
                  {GENERAL_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="important-only">Important / Urgent Only</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="important-only"
                  checked={showImportantOnly}
                  onCheckedChange={setShowImportantOnly}
                />
                <span className="text-sm text-muted-foreground">
                  {showImportantOnly ? 'Showing important notes only' : 'Showing all notes'}
                </span>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end mt-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                className="h-10 whitespace-nowrap"
              >
                <X className="h-3 w-3 mr-1" />
                Clear date filter
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <Label>Search Notes</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notes by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {notes.length === 0 
                ? 'No notes yet. Add your first note to get started.'
                : 'No notes match your current filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {note.title && (
                        <h4 className="font-semibold">{note.title}</h4>
                      )}
                      {note.is_important && (
                        <Badge variant="destructive" className="text-xs">
                          Important
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.note_text}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {note.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleViewNote(note)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditNote(note)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(note)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <EditVehicleNotesModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveNote}
        existingNote={editingNote}
        vehicleTags={VEHICLE_TAGS}
        generalTags={GENERAL_TAGS}
      />

      <ViewNoteModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        note={selectedNote}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
      />
    </div>
  );
}
