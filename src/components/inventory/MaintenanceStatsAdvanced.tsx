import React from "react";
import { TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdvancedStats {
  totalSessions: number;
  totalCost: number;
  avgDuration: number;
  returnedToService: number;
  retired: number;
  completionRate: number;
  costByProductType: { name: string; cost: number }[];
  topTechnicians: { name: string; sessions: number; avgCost: number }[];
  monthlyTrends: { month: string; sessions: number; cost: number }[];
}

interface MaintenanceStatsAdvancedProps {
  stats: AdvancedStats;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const MaintenanceStatsAdvanced: React.FC<MaintenanceStatsAdvancedProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const outcomeData = [
    { name: "Returned to Service", value: stats.returnedToService },
    { name: "Retired", value: stats.retired },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics - YTD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Total Work Orders (YTD)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Total Cost (YTD)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCost)}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Avg Duration (YTD)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.avgDuration} days</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Returned to Service (YTD)</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.returnedToService}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-600">Retired (YTD)</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.retired}</div>
        </div>
      </div>
    </div>
  );
};
