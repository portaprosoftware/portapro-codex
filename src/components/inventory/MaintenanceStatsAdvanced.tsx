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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Product Type */}
        {stats.costByProductType.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Cost by Product Type</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.costByProductType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Outcome Distribution */}
        {(stats.returnedToService > 0 || stats.retired > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Outcome Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Technicians */}
      {stats.topTechnicians.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Top Technicians</h4>
          <div className="space-y-3">
            {stats.topTechnicians.slice(0, 5).map((tech, index) => (
              <div key={tech.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{tech.name}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Sessions:</span>{" "}
                    <span className="font-semibold text-gray-900">{tech.sessions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Cost:</span>{" "}
                    <span className="font-semibold text-gray-900">{formatCurrency(tech.avgCost)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
