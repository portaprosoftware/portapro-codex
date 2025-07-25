
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Upload, Plus, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

const CustomerHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  // Fetch customers data
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Filter customers based on search and type
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone?.includes(searchTerm);
      
      const matchesType = selectedType === "all" || customer.customer_type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, selectedType]);


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
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-md border-0">
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
              <TableHead className="font-medium text-gray-900">Customer</TableHead>
              <TableHead className="font-medium text-gray-900">Type</TableHead>
              <TableHead className="font-medium text-gray-900">Phone</TableHead>
              <TableHead className="font-medium text-gray-900">Email</TableHead>
              <TableHead className="font-medium text-gray-900">Engagement</TableHead>
              <TableHead className="font-medium text-gray-900">Jobs</TableHead>
              <TableHead className="font-medium text-gray-900">Balance</TableHead>
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
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer, index) => (
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
                          {CUSTOMER_TYPES[customer.customer_type as keyof typeof CUSTOMER_TYPES].label}
                        </Badge>
                     ) : (
                       <span className="text-gray-500">-</span>
                     )}
                  </TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-bold px-3 py-1 rounded-full">
                      Low (0)
                    </Badge>
                  </TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>$0.00</TableCell>
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

    </div>
  );
};

export default CustomerHub;
