import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface UserListViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  isLoading?: boolean;
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

export function UserListView({ 
  users, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isLoading = false
}: UserListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const RoleIcon = roleIcons[user.current_role as keyof typeof roleIcons] || User;
            const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
            
            return (
              <TableRow 
                key={user.id} 
                className={`hover:bg-muted/50 ${!user.is_active ? 'opacity-60' : ''}`}
              >
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name}${user.last_name}`} />
                    <AvatarFallback className={`font-bold text-sm ${user.is_active ? 'bg-blue-500 text-white' : 'bg-gray-400 text-gray-600'}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">
                    <span className={!user.is_active ? 'text-gray-400' : ''}>
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    {user.email}
                  </span>
                </TableCell>
                
                <TableCell>
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
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={user.is_active ? "default" : "secondary"}
                    className={`font-medium ${!user.is_active ? 'bg-gray-300 text-gray-600' : ''}`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    {user.phone ? (
                      <div className="flex items-center">
                        <Phone className={`w-3 h-3 mr-1 ${!user.is_active ? 'text-gray-400' : ''}`} />
                        {user.phone}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                   <div className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
                     {user.created_at ? (
                       <div className="flex items-center">
                         <Calendar className={`w-3 h-3 mr-1 ${!user.is_active ? 'text-gray-400' : ''}`} />
                         {new Date(user.created_at).toLocaleDateString()}
                       </div>
                     ) : (
                       <span className="text-gray-300">—</span>
                     )}
                   </div>
                </TableCell>
                
                <TableCell>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}