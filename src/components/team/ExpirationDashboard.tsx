import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Calendar, Clock, Filter, Send } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

interface ExpirationItem {
  id: string;
  driver_id: string;
  driver_name: string;
  item_type: 'license' | 'medical_card' | 'training' | 'certification';
  item_name: string;
  expiry_date: string;
  status: 'overdue' | 'expiring_30' | 'expiring_60' | 'expiring_90';
  days_until_expiry: number;
}

interface ExpirationDashboardProps {
  className?: string;
}

export function ExpirationDashboard({ className }: ExpirationDashboardProps) {
  const [filterDriver, setFilterDriver] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch drivers for filter dropdown
  const { data: drivers } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, user_roles!inner(role)')
        .eq('user_roles.role', 'driver');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch expiration data
  const { data: expirationItems, isLoading } = useQuery({
    queryKey: ['expiration-items'],
    queryFn: async () => {
      const items: ExpirationItem[] = [];
      const today = new Date();

      // Fetch driver credentials (license and medical card)
      const { data: credentials, error: credentialsError } = await supabase
        .from('driver_credentials')
        .select(`
          driver_id,
          license_expiry_date,
          medical_card_expiry_date,
          profiles!inner(first_name, last_name)
        `);

      if (credentialsError) throw credentialsError;

      credentials?.forEach((cred: any) => {
        const driverName = `${cred.profiles.first_name} ${cred.profiles.last_name}`;
        
        // License expiry
        if (cred.license_expiry_date) {
          const expiryDate = new Date(cred.license_expiry_date);
          const daysUntil = differenceInDays(expiryDate, today);
          
          let status: ExpirationItem['status'] = 'expiring_90';
          if (daysUntil < 0) status = 'overdue';
          else if (daysUntil <= 30) status = 'expiring_30';
          else if (daysUntil <= 60) status = 'expiring_60';

          if (daysUntil <= 90) {
            items.push({
              id: `license-${cred.driver_id}`,
              driver_id: cred.driver_id,
              driver_name: driverName,
              item_type: 'license',
              item_name: 'Driver License',
              expiry_date: cred.license_expiry_date,
              status,
              days_until_expiry: daysUntil
            });
          }
        }

        // Medical card expiry
        if (cred.medical_card_expiry_date) {
          const expiryDate = new Date(cred.medical_card_expiry_date);
          const daysUntil = differenceInDays(expiryDate, today);
          
          let status: ExpirationItem['status'] = 'expiring_90';
          if (daysUntil < 0) status = 'overdue';
          else if (daysUntil <= 30) status = 'expiring_30';
          else if (daysUntil <= 60) status = 'expiring_60';

          if (daysUntil <= 90) {
            items.push({
              id: `medical-${cred.driver_id}`,
              driver_id: cred.driver_id,
              driver_name: driverName,
              item_type: 'medical_card',
              item_name: 'Medical Card',
              expiry_date: cred.medical_card_expiry_date,
              status,
              days_until_expiry: daysUntil
            });
          }
        }
      });

      // Fetch training records
      const { data: training, error: trainingError } = await supabase
        .from('driver_training_records')
        .select(`
          driver_id,
          training_type,
          next_due,
          profiles!inner(first_name, last_name)
        `)
        .not('next_due', 'is', null);

      if (trainingError) throw trainingError;

      training?.forEach((train: any) => {
        const driverName = `${train.profiles.first_name} ${train.profiles.last_name}`;
        const expiryDate = new Date(train.next_due);
        const daysUntil = differenceInDays(expiryDate, today);
        
        let status: ExpirationItem['status'] = 'expiring_90';
        if (daysUntil < 0) status = 'overdue';
        else if (daysUntil <= 30) status = 'expiring_30';
        else if (daysUntil <= 60) status = 'expiring_60';

        if (daysUntil <= 90) {
          items.push({
            id: `training-${train.driver_id}-${train.training_type}`,
            driver_id: train.driver_id,
            driver_name: driverName,
            item_type: 'training',
            item_name: train.training_type,
            expiry_date: train.next_due,
            status,
            days_until_expiry: daysUntil
          });
        }
      });

      return items.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
    }
  });

  const filteredItems = expirationItems?.filter(item => {
    if (filterDriver !== 'all' && item.driver_id !== filterDriver) return false;
    if (filterType !== 'all' && item.item_type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchTerm && !item.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.item_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  const getStatusBadge = (status: ExpirationItem['status'], daysUntil: number) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="font-medium">Overdue ({Math.abs(daysUntil)} days)</Badge>;
      case 'expiring_30':
        return <Badge className="bg-orange-500 text-white font-medium">Expires in {daysUntil} days</Badge>;
      case 'expiring_60':
        return <Badge className="bg-yellow-500 text-white font-medium">Expires in {daysUntil} days</Badge>;
      case 'expiring_90':
        return <Badge variant="outline" className="font-medium">Expires in {daysUntil} days</Badge>;
      default:
        return null;
    }
  };

  const statusCounts = {
    overdue: filteredItems.filter(item => item.status === 'overdue').length,
    expiring_30: filteredItems.filter(item => item.status === 'expiring_30').length,
    expiring_60: filteredItems.filter(item => item.status === 'expiring_60').length,
    expiring_90: filteredItems.filter(item => item.status === 'expiring_90').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{statusCounts.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.expiring_30}</p>
                <p className="text-sm text-muted-foreground">Expiring in 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.expiring_60}</p>
                <p className="text-sm text-muted-foreground">Expiring in 60 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.expiring_90}</p>
                <p className="text-sm text-muted-foreground">Expiring in 90 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Expiration Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Input
              placeholder="Search driver or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <Select value={filterDriver} onValueChange={setFilterDriver}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="medical_card">Medical Card</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="expiring_30">Expiring in 30 days</SelectItem>
                <SelectItem value="expiring_60">Expiring in 60 days</SelectItem>
                <SelectItem value="expiring_90">Expiring in 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Send Reminders
            </Button>
          </div>

          {/* Expiration Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Item Type</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No expiring items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.driver_name}</TableCell>
                      <TableCell className="capitalize">{item.item_type.replace('_', ' ')}</TableCell>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{format(new Date(item.expiry_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {getStatusBadge(item.status, item.days_until_expiry)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Send className="w-4 h-4 mr-2" />
                          Remind
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}