import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XCircle, DollarSign, Calendar, FileText, ChevronRight } from "lucide-react";

interface RetiredUnit {
  id: string;
  item_code: string;
  product_name: string;
  retired_date: string;
  retirement_reason: string;
  lifetime_maintenance_cost: number;
  total_sessions: number;
  condition: string;
}

interface RetiredUnitsSectionProps {
  units: RetiredUnit[];
  onViewDetails: (itemId: string, itemCode: string) => void;
}

export const RetiredUnitsSection: React.FC<RetiredUnitsSectionProps> = ({
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

  if (units.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No retired units yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <XCircle className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Retired Units</h3>
          <p className="text-sm text-gray-600">
            Units deemed unrepairable or not cost-effective ({units.length} total)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-lg border border-red-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bold text-red-600 text-lg">{unit.item_code}</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Retired
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{unit.product_name}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Retirement Reason</div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <FileText className="w-4 h-4 text-gray-500" />
                      {unit.retirement_reason || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Lifetime Cost</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-red-600">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(unit.lifetime_maintenance_cost)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Total Sessions</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {unit.total_sessions} session{unit.total_sessions !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Retired On</div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {formatDate(unit.retired_date)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Final condition: <span className="font-medium">{unit.condition || "Unknown"}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(unit.id, unit.item_code)}
                className="text-red-600 hover:text-red-800"
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
