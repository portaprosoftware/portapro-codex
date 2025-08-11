import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Crown, Headphones, Truck, User, Shield, 
  MoreVertical, Edit, Trash2, UserCheck, UserX,
  Phone, Mail, Calendar
} from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  current_role: string;
  phone?: string | null;
  hire_date?: string | null;
  created_at?: string | null;
}

interface EnhancedUserProfileCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
}

const roleIcons = {
  owner: Crown,
  dispatcher: Headphones,
  driver: Truck,
  customer: User,
  admin: Shield,
};

const roleLabels = {
  owner: "Admin",
  dispatcher: "Dispatcher",
  driver: "Driver", 
  customer: "Customer",
  admin: "Admin",
};


export function EnhancedUserProfileCard({ 
  user, 
  onEdit, 
  onDelete, 
  onToggleStatus
}: EnhancedUserProfileCardProps) {
  const RoleIcon = roleIcons[user.current_role as keyof typeof roleIcons] || User;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Card className={`h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary ${!user.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name}${user.last_name}`} />
              <AvatarFallback className={`font-bold ${user.is_active ? 'bg-blue-500 text-white' : 'bg-gray-400 text-gray-600'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className={`font-semibold text-lg ${!user.is_active ? 'text-gray-400' : ''}`}>
                {user.first_name} {user.last_name}
              </h3>
              <p className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>{user.email}</p>
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
            className={`text-white font-bold ${!user.is_active ? 'bg-gray-400' : ''}`}
            style={user.is_active ? { 
              background: user.current_role === 'owner' ? 'linear-gradient(135deg, #8B5CF6, #A855F7)' :
                         user.current_role === 'dispatcher' ? 'linear-gradient(135deg, #3B82F6, #2563EB)' :
                         user.current_role === 'admin' ? 'linear-gradient(135deg, #10B981, #059669)' :
                         user.current_role === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                         user.current_role === 'customer' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 
                         'linear-gradient(135deg, #6B7280, #4B5563)'
            } : {}}
          >
            <RoleIcon className={`w-3 h-3 mr-1 ${!user.is_active ? 'text-gray-600' : ''}`} />
            {roleLabels[user.current_role as keyof typeof roleLabels] || "No Role"}
          </Badge>
          
          <Badge 
            variant={user.is_active ? "default" : "secondary"}
            className={`font-medium ${!user.is_active ? 'bg-gray-300 text-gray-600' : ''}`}
          >
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          {user.phone && (
            <div className={`flex items-center text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
              <Phone className={`w-4 h-4 mr-2 ${!user.is_active ? 'text-gray-400' : ''}`} />
              {user.phone}
            </div>
          )}
          <div className={`flex items-center text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
            <Mail className={`w-4 h-4 mr-2 ${!user.is_active ? 'text-gray-400' : ''}`} />
            {user.email}
          </div>
          {user.created_at && (
            <div className={`flex items-center text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
              <Calendar className={`w-4 h-4 mr-2 ${!user.is_active ? 'text-gray-400' : ''}`} />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}