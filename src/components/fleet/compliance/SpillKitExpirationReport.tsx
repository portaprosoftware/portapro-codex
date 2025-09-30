import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Calendar, Package } from "lucide-react";
import { format, parseISO, differenceInDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function SpillKitExpirationReport() {
  const [dateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date())
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["spill-kit-expiration-report", dateRange],
    queryFn: async () => {
      const { data: checks, error } = await supabase
        .from("vehicle_spill_kit_checks")
        .select(`
          id,
          vehicle_id,
          has_kit,
          item_conditions,
          created_at,
          vehicles(id, license_plate, vehicle_type, make, model)
        `)
        .eq("has_kit", true)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Process data for analytics
      const monthlyData = new Map<string, { expired: number, expiringSoon: number, ok: number, inspections: number }>();
      const itemReplacements = new Map<string, number>();
      const categoryBreakdown = new Map<string, number>();
      
      const today = new Date();
      let totalExpired = 0;
      let totalExpiringSoon = 0;
      let totalOk = 0;

      checks?.forEach((check) => {
        const monthKey = format(parseISO(check.created_at), 'MMM yyyy');
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { expired: 0, expiringSoon: 0, ok: 0, inspections: 0 });
        }
        const monthStats = monthlyData.get(monthKey)!;
        monthStats.inspections++;

        const conditions = check.item_conditions as any;
        if (!conditions) return;

        Object.entries(conditions).forEach(([itemId, condition]: [string, any]) => {
          if (condition.expiration_date) {
            const expiryDate = parseISO(condition.expiration_date);
            const daysUntilExpiry = differenceInDays(expiryDate, today);
            
            // Track category
            const category = condition.item_category || 'Uncategorized';
            categoryBreakdown.set(category, (categoryBreakdown.get(category) || 0) + 1);

            // Track status
            if (daysUntilExpiry < 0) {
              monthStats.expired++;
              totalExpired++;
            } else if (daysUntilExpiry <= 30) {
              monthStats.expiringSoon++;
              totalExpiringSoon++;
            } else {
              monthStats.ok++;
              totalOk++;
            }

            // Track potential replacements (items that expired)
            if (daysUntilExpiry < 0) {
              const itemName = condition.item_name || itemId;
              itemReplacements.set(itemName, (itemReplacements.get(itemName) || 0) + 1);
            }
          }
        });
      });

      // Convert to arrays for charts
      const trendData = Array.from(monthlyData.entries()).map(([month, stats]) => ({
        month,
        ...stats
      }));

      const categoryData = Array.from(categoryBreakdown.entries()).map(([name, value]) => ({
        name,
        value
      }));

      const replacementData = Array.from(itemReplacements.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      return {
        trendData,
        categoryData,
        replacementData,
        summary: {
          totalExpired,
          totalExpiringSoon,
          totalOk,
          totalInspections: checks?.length || 0
        }
      };
    }
  });

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Spill Kit Expiration Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Period:', `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`],
      [],
      ['Summary'],
      ['Total Inspections', reportData.summary.totalInspections],
      ['Expired Items', reportData.summary.totalExpired],
      ['Expiring Soon (30 days)', reportData.summary.totalExpiringSoon],
      ['Items OK', reportData.summary.totalOk],
      [],
      ['Monthly Trend'],
      ['Month', 'Inspections', 'Expired', 'Expiring Soon', 'OK'],
      ...reportData.trendData.map(d => [d.month, d.inspections, d.expired, d.expiringSoon, d.ok]),
      [],
      ['Top Items Requiring Replacement'],
      ['Item Name', 'Replacement Count'],
      ...reportData.replacementData.map(d => [d.name, d.count]),
      [],
      ['Category Breakdown'],
      ['Category', 'Item Count'],
      ...reportData.categoryData.map(d => [d.name, d.value])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spill-kit-expiration-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Generating report...</div>;
  }

  if (!reportData) {
    return <div className="text-center p-12">No data available for report</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Spill Kit Expiration Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Period: {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
          </p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Inspections</p>
              <p className="text-2xl font-bold">{reportData.summary.totalInspections}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Expired Items</p>
              <p className="text-2xl font-bold text-red-600">{reportData.summary.totalExpired}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{reportData.summary.totalExpiringSoon}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Items OK</p>
              <p className="text-2xl font-bold text-green-600">{reportData.summary.totalOk}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Expiration Status Trend</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="expired" stroke="#ef4444" name="Expired" />
            <Line type="monotone" dataKey="expiringSoon" stroke="#f59e0b" name="Expiring Soon" />
            <Line type="monotone" dataKey="ok" stroke="#10b981" name="OK" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Items by Category</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Replacements */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Top Items Requiring Replacement</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.replacementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Replacement Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Key Insights</h4>
        <div className="space-y-3">
          {reportData.summary.totalExpired > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
              <Badge variant="destructive">Action Required</Badge>
              <p className="text-sm">
                {reportData.summary.totalExpired} items have expired and require immediate replacement to maintain compliance.
              </p>
            </div>
          )}
          {reportData.summary.totalExpiringSoon > 0 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <Badge className="bg-yellow-600">Warning</Badge>
              <p className="text-sm">
                {reportData.summary.totalExpiringSoon} items will expire within 30 days. Plan replacements accordingly.
              </p>
            </div>
          )}
          {reportData.replacementData.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <Badge variant="secondary">Trend</Badge>
              <p className="text-sm">
                <strong>{reportData.replacementData[0].name}</strong> is the most frequently expired item ({reportData.replacementData[0].count} times). Consider ordering extra inventory.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
