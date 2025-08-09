import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Crown, Headphones, Truck, User, Shield, 
  MoreVertical, Edit, Trash2, UserCheck, UserX,
  MapPin, Phone, Mail, Calendar
} from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  current_role: string;
  team_assignment?: string | null;
  work_location_id?: string | null;
  phone?: string | null;
  hire_date?: string | null;
}

interface EnhancedUserProfileCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  onTeamAssignmentChange: (userId: string, team: string) => void;
  onLocationChange: (userId: string, locationId: string) => void;
  teamOptions?: { value: string; label: string }[];
  locationOptions?: { value: string; label: string }[];
}

const roleIcons = {
  owner: Crown,
  dispatcher: Headphones,
  driver: Truck,
  customer: User,
  admin: Shield,
};

const roleLabels = {
  owner: "Owner",
  dispatcher: "Dispatcher",
  driver: "Driver", 
  customer: "Customer",
  admin: "Admin",
};

const defaultTeamOptions = [
  { value: 'drivers', label: 'Drivers' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'office', label: 'Office' },
  { value: 'maintenance', label: 'Maintenance' },
];

const defaultLocationOptions = [
  { value: 'main-yard', label: 'Main Yard' },
  { value: 'north-depot', label: 'North Depot' },
  { value: 'south-depot', label: 'South Depot' },
  { value: 'remote', label: 'Remote' },
];

export function EnhancedUserProfileCard({ 
  user, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onTeamAssignmentChange,
  onLocationChange,
  teamOptions,
  locationOptions
}: EnhancedUserProfileCardProps) {
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const tOptions = teamOptions ?? defaultTeamOptions;
  const lOptions = locationOptions ?? defaultLocationOptions;

  const RoleIcon = roleIcons[user.current_role as keyof typeof roleIcons] || User;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  const handleTeamChange = (newTeam: string) => {
    onTeamAssignmentChange(user.id, newTeam);
    setIsEditingTeam(false);
  };

  const handleLocationChange = (newLocation: string) => {
    onLocationChange(user.id, newLocation);
    setIsEditingLocation(false);
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name}${user.last_name}`} />
              <AvatarFallback className="bg-gradient-primary text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(user.id, user.is_active)}>
                {user.is_active ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(user)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Role and Status */}
        <div className="flex items-center space-x-2 mb-4">
          <Badge 
            className="text-white font-bold"
            style={{ 
              background: user.current_role === 'owner' ? 'linear-gradient(135deg, #8B5CF6, #A855F7)' :
                         user.current_role === 'dispatcher' ? 'linear-gradient(135deg, #3B82F6, #2563EB)' :
                         user.current_role === 'admin' ? 'linear-gradient(135deg, #10B981, #059669)' :
                         user.current_role === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                         user.current_role === 'customer' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 
                         'linear-gradient(135deg, #6B7280, #4B5563)'
            }}
          >
            <RoleIcon className="w-3 h-3 mr-1" />
            {roleLabels[user.current_role as keyof typeof roleLabels] || "No Role"}
          </Badge>
          
          <Badge 
            variant={user.is_active ? "default" : "secondary"}
            className="font-medium"
          >
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          {user.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-2" />
              {user.phone}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="w-4 h-4 mr-2" />
            {user.email}
          </div>
          {user.hire_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Joined {new Date(user.hire_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Team Assignment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Team Assignment:</span>
            {isEditingTeam ? (
              <Select 
                value={user.team_assignment || ''} 
                onValueChange={handleTeamChange}
                onOpenChange={(open) => !open && setIsEditingTeam(false)}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {tOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTeam(true)}
                className="h-8 px-2 text-xs"
              >
{user.team_assignment ? 
                  tOptions.find(t => t.value === user.team_assignment)?.label : 
                  "Assign Team"
                }
              </Button>
            )}
          </div>

          {/* Work Location */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Work Location:</span>
            {isEditingLocation ? (
              <Select 
                value={user.work_location_id || ''} 
                onValueChange={handleLocationChange}
                onOpenChange={(open) => !open && setIsEditingLocation(false)}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {lOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingLocation(true)}
                className="h-8 px-2 text-xs flex items-center"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {user.work_location_id ? 
                  lOptions.find(l => l.value === user.work_location_id)?.label : 
                  "Set Location"
                }
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}