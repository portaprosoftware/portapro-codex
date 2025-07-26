
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceEditPanel } from "./ServiceEditPanel";
import { Plus, Edit, DollarSign, Clock } from "lucide-react";

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
}

export const ServicesProvidedTab: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ["routine-maintenance-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_maintenance_services")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Services Offered</h2>
          <p className="text-gray-600">Manage your service offerings and pricing</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services?.map((service) => (
          <Card key={service.id} className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-2xl relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    {service.service_code}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService(service.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600 text-base">{formatPrice(service)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-600 font-semibold">
                  {service.estimated_duration_hours}h estimated
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {services?.length === 0 && (
        <Card className="p-12 text-center rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-4">Create your first service offering to get started</p>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Service
          </Button>
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
