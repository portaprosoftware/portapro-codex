import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DVIRForm } from "./DVIRForm";

export const DVIRList: React.FC = () => {
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dvir-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dvir_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  const openWOForFirstDefect = async (dvirId: string) => {
    try {
      const { data: defects, error } = await supabase
        .from("dvir_defects")
        .select("id, severity")
        .eq("dvir_id", dvirId)
        .neq("status", "closed")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      if (!defects || defects.length === 0) return;

      const defectId = defects[0].id as string;
      const { error: rpcErr } = await supabase.rpc("open_work_order_for_defect", { defect_uuid: defectId, _opened_by: null });
      if (rpcErr) throw rpcErr;
      alert("Work order created");
    } catch (e) {
      console.error(e);
      alert("Failed to create work order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">DVIRs</h2>
        <Button onClick={() => setOpen(true)}>New DVIR</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : data && data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Date</th>
                    <th className="py-2">Asset</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Defects</th>
                    <th className="py-2">Odometer</th>
                    <th className="py-2">OOS?</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((r:any) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="py-2">{r.asset_type}:{r.asset_id?.slice(0,8)}…</td>
                      <td className="py-2">{r.type}</td>
                      <td className="py-2">
                        <Badge>{r.status}</Badge>
                      </td>
                      <td className="py-2">{r.defects_count}</td>
                      <td className="py-2">{r.odometer_miles ?? "-"}</td>
                      <td className="py-2">{r.out_of_service_flag ? <Badge variant="destructive">Yes</Badge> : "No"}</td>
                      <td className="py-2 space-x-2">
                        {r.major_defect_present && (
                          <Button size="sm" variant="outline" onClick={()=>openWOForFirstDefect(r.id)}>Open WO</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No DVIRs yet</p>
          )}
        </CardContent>
      </Card>

      <DVIRForm open={open} onOpenChange={(v)=>{ setOpen(v); if(!v) refetch(); }} />
    </div>
  );
};