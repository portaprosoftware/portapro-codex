import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ asset_type: "vehicle", asset_id: "", description: "" });
  const [editForm, setEditForm] = useState({ status: "open", asset_type: "", asset_id: "", description: "" });

  if (isLoading) return <p className="text-gray-500">Loading…</p>;

  const byStatus = (status: string) => (data || []).filter((w:any)=>w.status === status);

  const openCreate = () => {
    setForm({ asset_type: "vehicle", asset_id: "", description: "" });
    setIsCreateOpen(true);
  };

  const createWorkOrder = async () => {
    try {
      const payload: any = {
        status: "open",
        asset_type: form.asset_type,
        asset_id: form.asset_id || null,
        description: form.description || null,
        opened_at: new Date().toISOString()
      };
      const { error } = await supabase.from("work_orders").insert(payload);
      if (error) throw error;
      setIsCreateOpen(false);
      await refetch();
      alert("Work order created");
    } catch (e) {
      console.error(e);
      alert("Failed to create work order");
    }
  };

  const openEdit = (w: any) => {
    setSelected(w);
    setEditForm({
      status: w.status || "open",
      asset_type: w.asset_type || "vehicle",
      asset_id: w.asset_id || "",
      description: w.description || ""
    });
    setIsEditOpen(true);
  };

  const updateWorkOrder = async () => {
    if (!selected) return;
    try {
      const updates: any = {
        status: editForm.status,
        asset_type: editForm.asset_type,
        asset_id: editForm.asset_id || null,
        description: editForm.description || null
      };
      const { error } = await supabase
        .from("work_orders")
        .update(updates)
        .eq("id", selected.id);
      if (error) throw error;
      setIsEditOpen(false);
      await refetch();
      alert("Work order updated");
    } catch (e) {
      console.error(e);
      alert("Failed to update work order");
    }
  };

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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Work Orders</h2>
        <Button variant="primary" onClick={openCreate}>Create Work Order</Button>
      </div>

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
                  <div className="mt-2 flex items-center gap-2">
                    {w.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={()=>complete(w.id)}>Mark Complete</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={()=>openEdit(w)}>Edit</Button>
                  </div>
                </div>
              ))}
              {byStatus(col).length === 0 && (
                <div className="text-sm text-gray-500">No items</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Work Order */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asset Type</label>
              <Select value={form.asset_type} onValueChange={(v)=>setForm((f)=>({...f, asset_type: v}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="product_item">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asset ID</label>
              <Input value={form.asset_id} onChange={(e)=>setForm((f)=>({...f, asset_id: e.target.value}))} placeholder="UUID or code" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e)=>setForm((f)=>({...f, description: e.target.value}))} placeholder="What needs to be done?" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={createWorkOrder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Work Order */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Work Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={editForm.status} onValueChange={(v)=>setEditForm((f)=>({...f, status: v}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COLUMNS.map(s=> (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asset Type</label>
              <Select value={editForm.asset_type} onValueChange={(v)=>setEditForm((f)=>({...f, asset_type: v}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="product_item">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asset ID</label>
              <Input value={editForm.asset_id} onChange={(e)=>setEditForm((f)=>({...f, asset_id: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={editForm.description} onChange={(e)=>setEditForm((f)=>({...f, description: e.target.value}))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={updateWorkOrder}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};