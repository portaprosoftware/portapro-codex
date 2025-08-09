import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_COLUMNS = [
  "open","awaiting_parts","in_progress","vendor","on_hold","ready_for_verification","completed"
];

export const WorkOrdersBoard: React.FC = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["work-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .order("opened_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const byStatus = (status: string) => (data || []).filter((w:any)=>w.status === status);

  const complete = async (id: string) => {
    try {
      const { error } = await supabase.rpc("complete_work_order", { work_order_uuid: id, _closed_by: null });
      if (error) throw error;
      await refetch();
      alert("Work order completed");
    } catch (e) {
      console.error(e);
      alert("Failed to complete work order");
    }
  };

  if (isLoading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((col) => (
        <Card key={col}>
          <CardHeader>
            <CardTitle className="capitalize">{col.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byStatus(col).map((w:any)=> (
              <div key={w.id} className="border rounded-md p-3 bg-white">
                <div className="text-sm font-medium">{w.asset_type}:{w.asset_id?.slice(0,8)}…</div>
                <div className="text-xs text-gray-600">Opened {new Date(w.opened_at).toLocaleDateString()}</div>
                <div className="text-sm mt-2">{w.description || "—"}</div>
                {w.status !== "completed" && (
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={()=>complete(w.id)}>Mark Complete</Button>
                  </div>
                )}
              </div>
            ))}
            {byStatus(col).length === 0 && (
              <div className="text-sm text-gray-500">No items</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};