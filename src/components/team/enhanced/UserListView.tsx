import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Crown, Headphones, Truck, User, Shield, 
  MoreVertical, Edit, Trash2, UserCheck, UserX,
  Phone, Mail, Calendar, ChevronUp, ChevronDown, ChevronsUpDown,
  ExternalLink, AlertTriangle, Clock, FileText, Navigation
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  current_role: string;
  phone?: string | null;
  profile_photo?: string | null;
  hire_date?: string | null;
  created_at?: string | null;
  // Driver-specific fields
  driver_id?: string;
  license_expiry_date?: string | null;
  medical_card_expiry_date?: string | null;
  next_training_due?: string | null;
  home_base?: string | null;
  supervisor?: string | null;
  app_last_login?: string | null;
}

type SortDirection = 'asc' | 'desc' | 'default';
type SortColumn = 'first_name' | 'last_name' | 'role' | 'status' | 'license_expiry' | 'medical_expiry' | 'training_due';

interface UserListViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  isLoading?: boolean;
  sortColumn?: SortColumn | null;
  sortDirection?: SortDirection;
  onSort?: (column: SortColumn) => void;
  canDeleteUser?: boolean;
  showDriverColumns?: boolean;
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
  isLoading = false,
  sortColumn,
  sortDirection = 'default',
  onSort,
  canDeleteUser = true,
  showDriverColumns = false
}: UserListViewProps) {

  // Helper function to get expiry status
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = differenceInDays(expiry, today);
    
    if (daysUntil < 0) return { status: 'overdue', daysUntil: Math.abs(daysUntil), color: 'red' };
    if (daysUntil <= 30) return { status: 'expiring', daysUntil, color: 'orange' };
    if (daysUntil <= 60) return { status: 'due_soon', daysUntil, color: 'yellow' };
    return { status: 'valid', daysUntil, color: 'green' };
  };

  const renderExpiryBadge = (expiryDate: string | null, label: string) => {
    if (!expiryDate) {
      return <Badge variant="outline" className="text-gray-400">Not Set</Badge>;
    }
    
    const status = getExpiryStatus(expiryDate);
    if (!status) return null;
    
    const { status: statusType, daysUntil, color } = status;
    
    if (statusType === 'overdue') {
      return (
        <Badge className="bg-red-500 text-white font-medium">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue {daysUntil}d
        </Badge>
      );
    }
    
    if (statusType === 'expiring') {
      return (
        <Badge className="bg-orange-500 text-white font-medium">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntil}d left
        </Badge>
      );
    }
    
    if (statusType === 'due_soon') {
      return (
        <Badge className="bg-yellow-500 text-white font-medium">
          {daysUntil}d left
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        {format(new Date(expiryDate), 'MMM dd, yyyy')}
      </Badge>
    );
  };
  // Create sortable header component
  const SortableHeader = ({ 
    column, 
    children, 
    className = "" 
  }: { 
    column: SortColumn; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const isActive = sortColumn === column;
    const getSortIcon = () => {
      if (!isActive) return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
      if (sortDirection === 'asc') return <ChevronUp className="w-4 h-4 ml-1 text-gray-600" />;
      if (sortDirection === 'desc') return <ChevronDown className="w-4 h-4 ml-1 text-gray-600" />;
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    };

    return (
      <TableHead 
        className={`font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none ${className}`}
        onClick={() => onSort && onSort(column)}
      >
        <div className="flex items-center">
          {children}
          {getSortIcon()}
        </div>
      </TableHead>
    );
  };
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
            <SortableHeader column="first_name">First</SortableHeader>
            <SortableHeader column="last_name">Last</SortableHeader>
            <TableHead>Email</TableHead>
            <SortableHeader column="role">Role</SortableHeader>
            <SortableHeader column="status">Status</SortableHeader>
            {showDriverColumns && (
              <>
                <SortableHeader column="license_expiry">License</SortableHeader>
                <SortableHeader column="medical_expiry">Medical Card</SortableHeader>
                <SortableHeader column="training_due">Next Training</SortableHeader>
                <TableHead>Home Base</TableHead>
              </>
            )}
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
                    <AvatarImage src={user.profile_photo || undefined} />
                    <AvatarFallback className="font-bold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">
                    <span className={!user.is_active ? 'text-gray-400' : ''}>
                      {user.first_name}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">
                    <span className={!user.is_active ? 'text-gray-400' : ''}>
                      {user.last_name}
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
                
                {showDriverColumns && (
                  <>
                    <TableCell>
                      {renderExpiryBadge(user.license_expiry_date, 'License')}
                    </TableCell>
                    
                    <TableCell>
                      {renderExpiryBadge(user.medical_card_expiry_date, 'Medical')}
                    </TableCell>
                    
                    <TableCell>
                      {renderExpiryBadge(user.next_training_due, 'Training')}
                    </TableCell>
                    
                    <TableCell>
                      <span className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
                        {user.home_base || '—'}
                      </span>
                    </TableCell>
                  </>
                )}
                
                <TableCell>
                  <div className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    {user.phone ? (
                      <div className="flex items-center">
                        <Phone className={`w-3 h-3 mr-1 ${!user.is_active ? 'text-gray-400' : ''}`} />
                        {user.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
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
                      {user.current_role === 'driver' && (
                        <DropdownMenuItem asChild>
                          <Link to={`/team-management/driver/${user.id}`}>
                            <Navigation className="w-4 h-4 mr-2" />
                            Driver Details
                          </Link>
                        </DropdownMenuItem>
                      )}
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
                      {canDeleteUser ? (
                        <DropdownMenuItem 
                          onClick={() => onDelete(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          disabled
                          className="text-muted-foreground opacity-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cannot delete last admin
                        </DropdownMenuItem>
                      )}
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