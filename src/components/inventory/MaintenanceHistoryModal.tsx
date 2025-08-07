import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, DollarSign, Package } from "lucide-react";

interface MaintenanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
}

export const MaintenanceHistoryModal: React.FC<MaintenanceHistoryModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
}) => {
  const { data: updates, isLoading } = useQuery({
    queryKey: ["maintenance-updates", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_updates")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case "progress":
        return "bg-blue-100 text-blue-800";
      case "repair":
        return "bg-red-100 text-red-800";
      case "parts":
        return "bg-green-100 text-green-800";
      case "inspection":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalCost = updates?.reduce((sum, update) => {
    return sum + (update.labor_cost || 0) + (update.parts_cost || 0);
  }, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maintenance History - {itemCode}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 text-center">Loading maintenance history...</div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {updates && updates.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{updates.length} Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Total Cost: {formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Item: {itemCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {updates && updates.length > 0 ? (
                updates.map((update, index) => (
                  <div key={update.id} className="relative">
                    {index < updates.length - 1 && (
                      <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getUpdateTypeColor(update.update_type)}>
                              {update.update_type.charAt(0).toUpperCase() + update.update_type.slice(1)}
                            </Badge>
                            {update.technician && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <User className="w-3 h-3" />
                                {update.technician}
                              </div>
                            )}
                          </div>
                          <time className="text-xs text-gray-500">
                            {formatDate(update.created_at)}
                          </time>
                        </div>
                        
                        <p className="text-gray-900 mb-3">{update.description}</p>
                        
                        {(update.labor_hours || update.labor_cost || update.parts_cost || update.parts_used) && (
                          <div className="border-t pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {update.labor_hours && (
                                <div>
                                  <span className="font-medium text-gray-700">Labor:</span>
                                  <span className="ml-2">{update.labor_hours}h</span>
                                  {update.labor_cost && (
                                    <span className="ml-2 text-green-600">
                                      ({formatCurrency(update.labor_cost)})
                                    </span>
                                  )}
                                </div>
                              )}
                              {update.parts_cost && (
                                <div>
                                  <span className="font-medium text-gray-700">Parts Cost:</span>
                                  <span className="ml-2 text-green-600">
                                    {formatCurrency(update.parts_cost)}
                                  </span>
                                </div>
                              )}
                              {update.parts_used && (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-700">Parts Used:</span>
                                  <span className="ml-2">{update.parts_used}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
                  <p className="text-gray-600">
                    No maintenance updates have been recorded for this item.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};