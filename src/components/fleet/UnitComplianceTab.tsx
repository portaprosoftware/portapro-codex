import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface SanitationLog {
  id: string;
  created_at: string;
  product_item_id: string | null;
  photos: any;
  notes: string | null;
  jobs?: { job_number?: string | null } | null;
  product_items?: { id: string; item_code: string; status?: string | null } | null;
}

interface UnitStatus {
  product_item_id: string;
  item_code: string;
  lastCleaned: Date;
  nextDue: Date;
  status: "good" | "due_soon" | "overdue";
}

const DEFAULT_FREQUENCY_DAYS = 7;

function computeStatus(lastCleaned: Date): UnitStatus["status"] {
  const now = new Date();
  const diffMs = now.getTime() - lastCleaned.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > DEFAULT_FREQUENCY_DAYS) return "overdue";
  if (diffDays >= DEFAULT_FREQUENCY_DAYS - 1) return "due_soon"; // within ~1 day
  return "good";
}

function statusBadgeClasses(status: UnitStatus["status"]) {
  switch (status) {
    case "overdue":
      return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
    case "due_soon":
      return "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-0";
    default:
      return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
  }
}

export const UnitComplianceTab: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["unit-sanitation-compliance"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await supabase
        .from("sanitation_logs")
        .select(
          `id, created_at, notes, photos, product_item_id, jobs(job_number), product_items(id, item_code, status)`
        )
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      const logs = (data as SanitationLog[]) || [];
      // Reduce to latest log per product_item_id (skip nulls)
      const byUnit = new Map<string, UnitStatus>();
      for (const log of logs) {
        if (!log.product_item_id || !log.product_items) continue;
        if (!byUnit.has(log.product_item_id)) {
          const last = new Date(log.created_at);
          const next = new Date(last);
          next.setDate(last.getDate() + DEFAULT_FREQUENCY_DAYS);
          byUnit.set(log.product_item_id, {
            product_item_id: log.product_item_id,
            item_code: log.product_items.item_code,
            lastCleaned: last,
            nextDue: next,
            status: computeStatus(last),
          });
        }
      }
      return Array.from(byUnit.values());
    },
  });

  const units: UnitStatus[] = data || [];
  const overdue = units.filter((u) => u.status === "overdue").length;
  const dueSoon = units.filter((u) => u.status === "due_soon").length;
  const good = units.filter((u) => u.status === "good").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Due Soon (≤ 1 day)</p>
              <p className="text-2xl font-bold text-amber-900">{dueSoon}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Good</p>
              <p className="text-2xl font-bold text-green-900">{good}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Unit Sanitation Status</h2>
        </div>

        {units.map((unit) => (
          <Card key={unit.product_item_id} className="p-4 hover:shadow-md transition-shadow rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{unit.item_code}</h3>
                <p className="text-sm text-gray-600">
                  Last cleaned: {unit.lastCleaned.toLocaleDateString()} • Next due: {unit.nextDue.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusBadgeClasses(unit.status)}>
                  {unit.status === "good" && "Good"}
                  {unit.status === "due_soon" && "Due Soon"}
                  {unit.status === "overdue" && "Overdue"}
                </Badge>
                <Button variant="outline" size="sm">View History</Button>
              </div>
            </div>
          </Card>
        ))}

        {units.length === 0 && (
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sanitation records found</h3>
            <p className="text-gray-600">Complete a Service Report with Sanitation enabled to see unit compliance here.</p>
          </Card>
        )}
      </div>
    </section>
  );
};
