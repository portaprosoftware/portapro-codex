import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ServiceEditPanel } from "./ServiceEditPanel";
import { Plus, Edit, DollarSign, Clock, Search, Grid, List, Wrench, FileText } from "lucide-react";

interface Service {
  id: string;
  name: string;
  service_code: string;
  description: string;
  pricing_method: string;
  per_visit_cost: number;
  per_hour_cost: number;
  flat_rate_cost: number;
  estimated_duration_hours: number;
  category_id: string;
  default_template_id: string | null;
  template?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export const ServicesProvidedTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "icons">("list");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ["routine-maintenance-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_maintenance_services")
        .select(`
          *,
          template:maintenance_report_templates!default_template_id(
            id,
            name,
            description
          )
        `)
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter services based on search term
  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.service_code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatPrice = (service: Service) => {
    switch (service.pricing_method) {
      case "per_visit":
        return `$${service.per_visit_cost}/visit`;
      case "per_hour":
        return `$${service.per_hour_cost}/hour`;
      case "flat_rate":
        return `$${service.flat_rate_cost}`;
      default:
        return "Custom pricing";
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
          <h2 className="text-xl font-semibold text-gray-900">Services Offered</h2>
          <p className="text-gray-600">Manage the services your company provides</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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
              variant={viewMode === "icons" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("icons")}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search services by name, description, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Services Display */}
      {viewMode === "list" ? (
        /* List View */
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {service.service_code && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {service.service_code}
                        </Badge>
                      )}
                      {service.template && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {service.template.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{service.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold text-green-600">{formatPrice(service)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.estimated_duration_hours}h estimated</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedService(service.id)}
                  >
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Icon View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-2xl group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                <div className="flex flex-col items-center gap-2 mb-3">
                  {service.service_code && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {service.service_code}
                    </Badge>
                  )}
                  {service.template && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {service.template.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-600">{formatPrice(service)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{service.estimated_duration_hours}h</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedService(service.id)}
                  >
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredServices.length === 0 && !isLoading && (
        <Card className="p-12 text-center rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No services found" : "No services yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? `No services match "${searchTerm}"` : "Add your first service to get started"}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          )}
        </Card>
      )}

      {/* Service Edit Panel */}
      <ServiceEditPanel
        serviceId={selectedService}
        isOpen={!!selectedService || isCreating}
        isCreating={isCreating}
        onClose={() => {
          setSelectedService(null);
          setIsCreating(false);
        }}
      />
    </div>
  );
};