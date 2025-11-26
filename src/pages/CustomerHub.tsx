
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Upload, Plus, Search, Filter, Eye, EyeOff, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Phone, Mail, Check, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EnhancedCard } from "@/components/ui/enhanced-card";

import { SimpleCustomerModal } from "@/components/customers/SimpleCustomerModal";
import { CustomerImportModal } from "@/components/customers/CustomerImportModal";
import { formatCategoryDisplay } from "@/lib/categoryUtils";
import { formatPhoneNumber } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tenantTable } from "@/lib/db/tenant";
import { useTenantId } from "@/lib/tenantQuery";

const CUSTOMER_TYPES = {
  "bars_restaurants": { label: "Bars & Restaurants", color: "#EAB308" },
  "construction": { label: "Construction", color: "#FF6600" },
  "emergency_disaster_relief": { label: "Emergency & Disaster Relief", color: "#CC3333" },
  "events_festivals": { label: "Events & Festivals", color: "#8A2BE2" },
  "municipal_government": { label: "Municipal & Government", color: "#3366FF" },
  "other": { label: "Other", color: "#6B7280" },
  "private_events_weddings": { label: "Private Events & Weddings", color: "#CC3366" },
  "retail": { label: "Retail", color: "#14B8A6" },
  "sports_recreation": { label: "Sports & Recreation", color: "#33CC66" },
  "commercial": { label: "Commercial", color: "#4A4A4A" }
};

const getCustomerTypeGradient = (type: string) => {
  switch (type) {
    case 'bars_restaurants': return 'from-yellow-500 to-yellow-600';
    case 'construction': return 'from-orange-500 to-orange-600';
    case 'emergency_disaster_relief': return 'from-red-500 to-red-600';
    case 'events_festivals': return 'from-purple-500 to-purple-600';
    case 'municipal_government': return 'from-blue-500 to-blue-600';
    case 'other': return 'from-gray-500 to-gray-600';
    case 'private_events_weddings': return 'from-pink-500 to-pink-600';
    case 'retail': return 'from-teal-500 to-teal-600';
    case 'sports_recreation': return 'from-green-500 to-green-600';
    case 'commercial': return 'from-blue-500 to-blue-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

type SortDirection = 'asc' | 'desc' | 'default';
type SortColumn = 'customer' | 'type' | 'last_delivery' | null;

const CustomerHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('default');
  const [showLastDelivery, setShowLastDelivery] = useState(true);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const tenantId = useTenantId();

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
    } else {
      if (sortDirection === 'default') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('default');
        setSortColumn(null);
      }
    }
  };

  // Fetch customers data
  const { data: customersData = [], isLoading, error } = useQuery({
    queryKey: ['customers', tenantId],
    queryFn: async () => {
      const { data: customers, error: customerError } = await tenantTable(
        supabase,
        tenantId,
        'customers'
      )
        .select('*')
        .order('name');

      if (customerError) throw customerError;
      return customers || [];
    },
    enabled: !!tenantId,
  });

  // Fetch last delivery date for each customer
  const { data: lastDeliveriesData = new Map() } = useQuery({
    queryKey: ['customer-last-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('customer_id, scheduled_date, actual_completion_time')
        .eq('job_type', 'delivery')
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      
      // Get the most recent delivery for each customer
      const deliveryMap = new Map<string, string>();
      data?.forEach(job => {
        if (!deliveryMap.has(job.customer_id)) {
          deliveryMap.set(job.customer_id, job.scheduled_date || job.actual_completion_time);
        }
      });
      
      return deliveryMap;
    },
  });

  // Calculate days since last delivery
  const calculateDaysSince = (date: string | null): number | null => {
    if (!date) return null;
    const deliveryDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - deliveryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get color class based on days since delivery
  const getDaysColorClass = (days: number | null): string => {
    if (days === null) return 'text-gray-400';
    if (days <= 30) return 'text-green-600 font-semibold';
    if (days <= 60) return 'text-yellow-600 font-semibold';
    if (days <= 90) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  // Create sortable header component
  const SortableHeader = ({ column, children, className = "" }: { 
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
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center">
          {children}
          {getSortIcon()}
        </div>
      </TableHead>
    );
  };

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    // First, enrich customers with last delivery data
    const enrichedCustomers = customersData.map(customer => {
      const lastDeliveryDate = lastDeliveriesData.get(customer.id);
      const daysSinceDelivery = calculateDaysSince(lastDeliveryDate);
      return {
        ...customer,
        last_delivery_date: lastDeliveryDate,
        days_since_last_delivery: daysSinceDelivery
      };
    });

    let filtered = enrichedCustomers.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone?.includes(searchTerm);
      
      const matchesType = selectedType === "all" || customer.customer_type === selectedType;
      
      return matchesSearch && matchesType;
    });

    // Apply sorting
    if (sortColumn && sortDirection !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        
        switch (sortColumn) {
          case 'customer':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'type':
            const typeA = a.customer_type || '';
            const typeB = b.customer_type || '';
            comparison = typeA.localeCompare(typeB);
            break;
          case 'last_delivery':
            const daysA = a.days_since_last_delivery ?? Number.MAX_SAFE_INTEGER;
            const daysB = b.days_since_last_delivery ?? Number.MAX_SAFE_INTEGER;
            comparison = daysA - daysB;
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [customersData, lastDeliveriesData, searchTerm, selectedType, sortColumn, sortDirection]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-2 md:px-4 py-4 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Customer Hub</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Manage all your customer data in one place</p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 w-full md:w-auto"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold px-4 py-2 rounded-md border-0 w-full md:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </Button>
            </div>
          </div>
        </div>

        {/* Customers List Card */}
        <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
          {/* Filters & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900">All Customers</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Mobile/Tablet: Drawer - Desktop: Select */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                
                {/* Desktop Select (lg and up) */}
                <div className="hidden lg:block">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(CUSTOMER_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile/Tablet Drawer (below lg) */}
                <div className="lg:hidden w-full sm:w-40">
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-10 text-base"
                      >
                        <span className="truncate">
                          {selectedType === 'all' 
                            ? 'All Types' 
                            : CUSTOMER_TYPES[selectedType as keyof typeof CUSTOMER_TYPES]?.label || 'All Types'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[75vh]">
                      <DrawerHeader className="border-b">
                        <DrawerTitle className="text-lg">Customer Type</DrawerTitle>
                      </DrawerHeader>
                      <div className="overflow-y-auto p-4">
                        <div className="space-y-1">
                          {/* All Types Option */}
                          <Button
                            variant="ghost"
                            className={`w-full justify-start h-12 text-base font-normal ${
                              selectedType === 'all' ? 'bg-accent' : ''
                            }`}
                            onClick={() => setSelectedType('all')}
                          >
                            <Check className={`mr-2 h-5 w-5 ${selectedType === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                            All Types
                          </Button>

                          {/* Customer Type Options */}
                          {Object.entries(CUSTOMER_TYPES).map(([key, type]) => (
                            <Button
                              key={key}
                              variant="ghost"
                              className={`w-full justify-start h-12 text-base font-normal ${
                                selectedType === key ? 'bg-accent' : ''
                              }`}
                              onClick={() => setSelectedType(key)}
                            >
                              <Check className={`mr-2 h-5 w-5 ${selectedType === key ? 'opacity-100' : 'opacity-0'}`} />
                              {type.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 h-10 text-base"
                />
              </div>
            </div>
          </div>

          {/* Desktop Table View (lg and up) */}
          <div className="hidden lg:block">
            <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader column="customer">Customer</SortableHeader>
                <SortableHeader column="type">Type</SortableHeader>
                <TableHead className="font-medium text-gray-900">Phone</TableHead>
                <TableHead className="font-medium text-gray-900">Email</TableHead>
                {showLastDelivery && (
                  <SortableHeader column="last_delivery" className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Days Since Last Delivery
                      <Popover open={showInfoPopover} onOpenChange={setShowInfoPopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowInfoPopover(!showInfoPopover);
                            }}
                          >
                            <Info className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-64 p-3 text-sm bg-white border shadow-lg z-50"
                          side="top"
                          align="end"
                        >
                          Select truck icon to hide this column data.
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLastDelivery(false);
                        }}
                        title="Hide Days Since Last Delivery"
                      >
                        <Truck className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </div>
                  </SortableHeader>
                )}
                {!showLastDelivery && (
                  <TableHead className="font-medium text-gray-900 w-12 text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                        onClick={() => setShowLastDelivery(true)}
                        title="Show Days Since Last Delivery"
                      >
                        <Truck className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedCustomers.map((customer, index) => (
                  <TableRow 
                    key={customer.id} 
                    className={`transition-colors hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <TableCell className="font-medium">
                      <Link 
                        to={`/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors font-bold"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {customer.customer_type && CUSTOMER_TYPES[customer.customer_type as keyof typeof CUSTOMER_TYPES] ? (
                        <Badge className={`bg-gradient-to-r ${getCustomerTypeGradient(customer.customer_type)} text-white border-0 font-bold px-3 py-1 rounded-full`}>
                          {formatCategoryDisplay(customer.customer_type)}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatPhoneNumber(customer.phone) || '-'}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    {showLastDelivery && (
                      <TableCell>
                        {customer.days_since_last_delivery !== null ? (
                          <span className={getDaysColorClass(customer.days_since_last_delivery)}>
                            {customer.days_since_last_delivery} {customer.days_since_last_delivery === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                    )}
                    {!showLastDelivery && (
                      <TableCell className="w-12" />
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

          {/* Mobile Card View (below lg) */}
          <div className="lg:hidden space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading customers...
              </div>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No customers found
              </div>
            ) : (
              filteredAndSortedCustomers.map((customer) => (
                <Link 
                  key={customer.id} 
                  to={`/customers/${customer.id}`}
                  className="block"
                >
                  <EnhancedCard 
                    variant="default" 
                    className="p-4 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Customer Name */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                          {customer.name}
                        </h3>
                        
                        {/* Type Badge */}
                        {customer.customer_type && CUSTOMER_TYPES[customer.customer_type as keyof typeof CUSTOMER_TYPES] && (
                          <Badge className={`bg-gradient-to-r ${getCustomerTypeGradient(customer.customer_type)} text-white border-0 font-bold px-3 py-1 rounded-full mb-3 inline-block`}>
                            {formatCategoryDisplay(customer.customer_type)}
                          </Badge>
                        )}
                        
                        {/* Contact Info */}
                        <div className="space-y-2 mt-3">
                          {customer.phone && (
                            <a 
                              href={`tel:${customer.phone}`} 
                              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors min-h-[44px] -ml-2 pl-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span className="text-base">{formatPhoneNumber(customer.phone)}</span>
                            </a>
                          )}
                          
                          {customer.email && (
                            <a 
                              href={`mailto:${customer.email}`} 
                              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors min-h-[44px] -ml-2 pl-2 break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              <span className="text-base">{customer.email}</span>
                            </a>
                          )}

                          {/* Last Delivery Info */}
                          <div className="flex items-center gap-2 text-gray-700 min-h-[44px] -ml-2 pl-2 pt-1 border-t mt-3">
                            <span className="text-sm text-gray-600">Last Delivery:</span>
                            {customer.days_since_last_delivery !== null ? (
                              <span className={`text-sm ${getDaysColorClass(customer.days_since_last_delivery)}`}>
                                {customer.days_since_last_delivery} {customer.days_since_last_delivery === 1 ? 'day' : 'days'} ago
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Never</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow Icon */}
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </EnhancedCard>
                </Link>
              ))
            )}
          </div>
        </div>

        <SimpleCustomerModal
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          console.log('Customer import completed successfully');
        }}
      />
      </div>
    </div>
  );
};

export default CustomerHub;
