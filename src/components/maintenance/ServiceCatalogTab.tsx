import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ServiceEditModal } from "./ServiceEditModal";
import { Search, Plus, Edit, Copy, Archive, Grid, List, Clock, DollarSign, MoreVertical, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ServiceTemplateAssignmentModal } from "./ServiceTemplateAssignmentModal";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  pricing_method: string;
  default_rate: number;
  estimated_duration_minutes: number;
  default_template_id: string;
  consumables_recipe: any;
  evidence_requirements: any;
  eligible_targets: any;
  can_be_recurring: boolean;
  is_active: boolean;
  created_at: string;
}

export const ServiceCatalogTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templateAssignmentService, setTemplateAssignmentService] = useState<Service | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data?.map(service => ({
        ...service,
        eligible_targets: Array.isArray(service.eligible_targets) 
          ? service.eligible_targets 
          : (service.eligible_targets as any)?.units || []
      })) as Service[];
    }
  });

  const archiveServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service archived successfully');
    },
    onError: () => {
      toast.error('Failed to archive service');
    }
  });

  const duplicateServiceMutation = useMutation({
    mutationFn: async (service: Service) => {
      const { error } = await supabase
        .from('services')
        .insert([{
          ...service,
          id: undefined,
          name: `${service.name} (Copy)`,
          code: `${service.code}_COPY`,
          created_at: undefined
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate service');
    }
  });

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cleaning':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0';
      case 'maintenance':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0';
      case 'emergency':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0';
      case 'inspection':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0';
    }
  };

  const formatRate = (rate: number, method: string) => {
    if (!rate) return 'No charge';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(rate);
    
    switch (method) {
      case 'per_hour':
        return `${formatted}/hr`;
      case 'per_visit':
        return `${formatted}/visit`;
      default:
        return formatted;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Service Catalog</h2>
          <p className="text-gray-600">Define the services you offer. These power scheduling and the driver app.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Services Display */}
      {filteredServices.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <Plus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first service.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <Badge className={`text-xs ${getCategoryColor(service.category)}`}>
                        {service.category?.charAt(0).toUpperCase() + service.category?.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Code: {service.code}</p>
                    <p className="text-sm text-gray-700">{service.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">
                      {formatRate(service.default_rate, service.pricing_method)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">{service.estimated_duration_minutes}m</span>
                  </div>
                </div>

                {service.eligible_targets && service.eligible_targets.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Applies to:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.eligible_targets.slice(0, 3).map((target, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {target}
                        </Badge>
                      ))}
                      {service.eligible_targets.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.eligible_targets.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedService(service)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateServiceMutation.mutate(service)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveServiceMutation.mutate(service.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Archive className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Recurring</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Template</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`text-xs ${getCategoryColor(service.category)}`}>
                        {service.category?.charAt(0).toUpperCase() + service.category?.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatRate(service.default_rate, service.pricing_method)}
                    </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {service.estimated_duration_minutes}m
                </td>
                <td className="px-6 py-4">
                  <Badge variant={service.can_be_recurring ? "default" : "outline"} className="text-xs">
                    {service.can_be_recurring ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {service.default_template_id ? (
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                      <FileText className="w-3 h-3 mr-1" />
                      Template Set
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">No template</span>
                  )}
                </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedService(service)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTemplateAssignmentService(service)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Assign Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateServiceMutation.mutate(service)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => archiveServiceMutation.mutate(service.id)}
                            className="text-red-600"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <ServiceEditModal
        isOpen={isCreating || selectedService !== null}
        onClose={() => {
          setIsCreating(false);
          setSelectedService(null);
        }}
        service={selectedService}
        isCreating={isCreating}
      />
      
      <ServiceTemplateAssignmentModal
        serviceId={templateAssignmentService?.id || null}
        serviceName={templateAssignmentService?.name || null}
        isOpen={templateAssignmentService !== null}
        onClose={() => setTemplateAssignmentService(null)}
      />
    </div>
  );
};