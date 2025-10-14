import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, DollarSign, ChevronRight, TrendingUp, AlertCircle } from "lucide-react";

interface ReturnedUnit {
  id: string;
  item_code: string;
  product_name: string;
  completed_at: string;
  total_cost: number;
  downtime_days: number;
  condition_before: string;
  condition_after: string;
  returned_to_maintenance: boolean;
  session_number: number;
}

interface ReturnedToServiceSectionProps {
  units: ReturnedUnit[];
  onViewDetails: (itemId: string, itemCode: string) => void;
}

export const ReturnedToServiceSection: React.FC<ReturnedToServiceSectionProps> = ({
  units,
  onViewDetails,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
      case "good":
        return "bg-green-100 text-green-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
      case "needs_repair":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (units.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No units returned to service yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Returned to Service</h3>
          <p className="text-sm text-gray-600">
            Units successfully repaired and back in inventory ({units.length} total)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bold text-blue-600 text-lg">{unit.item_code}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Session #{unit.session_number}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{unit.product_name}</Badge>
                  {unit.returned_to_maintenance && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Repeat Issue
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Condition Change</div>
                    <div className="flex items-center gap-2">
                      <Badge className={getConditionColor(unit.condition_before)} variant="secondary">
                        {unit.condition_before || "Unknown"}
                      </Badge>
                      <span className="text-gray-400">→</span>
                      <Badge className={getConditionColor(unit.condition_after)} variant="secondary">
                        {unit.condition_after || "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Downtime</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <Clock className="w-4 h-4 text-orange-600" />
                      {unit.downtime_days} days
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Repair Cost</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      {formatCurrency(unit.total_cost)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Returned On</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(unit.completed_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    Repair effectiveness: {unit.returned_to_maintenance ? "Needs monitoring" : "Good"}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(unit.id, unit.item_code)}
                className="text-blue-600 hover:text-blue-800"
              >
                Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
