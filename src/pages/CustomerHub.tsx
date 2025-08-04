
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Upload, Plus, Search, Filter, Eye, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleCustomerModal } from "@/components/customers/SimpleCustomerModal";
import { formatCategoryDisplay } from "@/lib/categoryUtils";
import { formatPhoneNumber } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CUSTOMER_TYPES = {
  "events_festivals": { label: "Events & Festivals", color: "#8A2BE2" },
  "sports_recreation": { label: "Sports & Recreation", color: "#33CC66" },
  "municipal_government": { label: "Municipal & Government", color: "#3366FF" },
  "private_events_weddings": { label: "Private Events & Weddings", color: "#CC3366" },
  "construction": { label: "Construction", color: "#FF6600" },
  "commercial": { label: "Commercial", color: "#4A4A4A" },
  "emergency_disaster_relief": { label: "Emergency & Disaster Relief", color: "#CC3333" }
};

const getCustomerTypeGradient = (type: string) => {
  switch (type) {
    case 'commercial': return 'from-blue-500 to-blue-600';
    case 'events_festivals': return 'from-purple-500 to-purple-600';
    case 'sports_recreation': return 'from-green-500 to-green-600';
    case 'municipal_government': return 'from-blue-500 to-blue-600';
    case 'private_events_weddings': return 'from-pink-500 to-pink-600';
    case 'construction': return 'from-orange-500 to-orange-600';
    case 'emergency_disaster_relief': return 'from-red-500 to-red-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

type SortDirection = 'asc' | 'desc' | 'default';
type SortColumn = 'customer' | 'type' | 'engagement' | 'jobs' | 'balance' | null;

interface CustomerWithEngagement {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customer_type?: string;
  created_at: string;
  updated_at: string;
  // Add other customer fields as needed
  engagement_score: number;
  engagement_level: 'Low' | 'Medium' | 'High';
  jobs_count: number;
  total_balance: number;
}

const calculateEngagementLevel = (score: number): 'Low' | 'Medium' | 'High' => {
  if (score <= 30) return 'Low';
  if (score <= 70) return 'Medium';
  return 'High';
};

const getEngagementGradient = (level: string) => {
  switch (level) {
    case 'High': return 'from-green-500 to-green-600';
    case 'Medium': return 'from-yellow-500 to-yellow-600';
    case 'Low': return 'from-red-500 to-red-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

const CustomerHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('default');

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

  // Fetch customers data with engagement calculations
  const { data: customersData = [], isLoading, error } = useQuery({
    queryKey: ['customers-with-engagement'],
    queryFn: async () => {
      console.log('Fetching customers with engagement data...');
      
      // Get customers basic data first
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (customerError) {
        console.error('Customer fetch error:', customerError);
        throw customerError;
      }

      // For now, calculate engagement with mock data since we need to establish the structure
      // In production, this would be calculated from actual job/interaction data
      const customersWithEngagement: CustomerWithEngagement[] = customers?.map(customer => {
        // Mock engagement calculation - replace with real data later
        const mockJobsCount = Math.floor(Math.random() * 20);
        const mockInteractionsCount = Math.floor(Math.random() * 10);
        const mockCommunicationsCount = Math.floor(Math.random() * 15);
        
        // Calculate engagement score
        const engagementScore = (mockJobsCount * 10) + (mockInteractionsCount * 15) + (mockCommunicationsCount * 5);
        const engagementLevel = calculateEngagementLevel(engagementScore);
        
        return {
          ...customer,
          engagement_score: engagementScore,
          engagement_level: engagementLevel,
          jobs_count: mockJobsCount,
          total_balance: Math.floor(Math.random() * 5000) // Mock balance
        };
      }) || [];
      
      console.log('Customers with engagement fetched successfully:', customersWithEngagement.length);
      return customersWithEngagement;
    },
    retry: (failureCount, error) => {
      console.log('Query retry attempt:', failureCount, error);
      return failureCount < 2;
    },
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
  });

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
    let filtered = customersData.filter(customer => {
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
          case 'engagement':
            // Sort by engagement level first, then by score
            const levelOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
            const levelComparison = levelOrder[a.engagement_level] - levelOrder[b.engagement_level];
            comparison = levelComparison !== 0 ? levelComparison : a.engagement_score - b.engagement_score;
            break;
          case 'jobs':
            comparison = a.jobs_count - b.jobs_count;
            break;
          case 'balance':
            comparison = a.total_balance - b.total_balance;
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [customersData, searchTerm, selectedType, sortColumn, sortDirection]);


  return (
    <div className="max-w-none px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Customer Hub</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Manage all your customer data in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold px-4 py-2 rounded-md border-0"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">All Customers</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
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
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="customer">Customer</SortableHeader>
              <SortableHeader column="type">Type</SortableHeader>
              <TableHead className="font-medium text-gray-900">Phone</TableHead>
              <TableHead className="font-medium text-gray-900">Email</TableHead>
              <SortableHeader column="engagement">Engagement</SortableHeader>
              <SortableHeader column="jobs">Jobs</SortableHeader>
              <SortableHeader column="balance">Balance</SortableHeader>
              <TableHead className="font-medium text-gray-900">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                  <TableCell>
                    <Badge className={`bg-gradient-to-r ${getEngagementGradient(customer.engagement_level)} text-white border-0 font-bold px-3 py-1 rounded-full`}>
                      {customer.engagement_level} ({customer.engagement_score})
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.jobs_count}</TableCell>
                  <TableCell>${customer.total_balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SimpleCustomerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default CustomerHub;
