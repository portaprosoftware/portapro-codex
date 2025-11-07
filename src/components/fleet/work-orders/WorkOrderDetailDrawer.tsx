import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { safeInsert } from "@/lib/supabase-helpers";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertTriangle,
  Wrench,
  FileText,
  History,
  DollarSign,
  Calendar,
  User,
  Truck,
  AlertCircle,
  Clock,
  Download
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { SignatureButton } from "./SignatureButton";
import { WorkOrder } from "./types";
import { exportWorkOrderToPDF } from "@/lib/workOrderExport";

interface WorkOrderDetailDrawerProps {
  workOrderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const WorkOrderDetailDrawer: React.FC<WorkOrderDetailDrawerProps> = ({
  workOrderId,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("work");

  // Form state for close-out
  const [meterAtClose, setMeterAtClose] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [returnToService, setReturnToService] = useState(false);

  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery({
    queryKey: ["work-order-detail", workOrderId],
    queryFn: async () => {
      if (!workOrderId) return null;

      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          work_order_parts(*),
          work_order_labor(*),
          work_order_signatures(*),
          work_order_history(*)
        `)
        .eq("id", workOrderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workOrderId && open
  });

  // Fetch vehicle/asset details
  const { data: asset } = useQuery({
    queryKey: ["wo-asset", workOrder?.asset_id],
    queryFn: async () => {
      if (!workOrder?.asset_id || !workOrder?.asset_type) return null;
      
      // Only fetch vehicles for now (trailers table may not exist yet)
      if (workOrder.asset_type === "vehicle") {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", workOrder.asset_id)
          .single();
        if (error) throw error;
        return data;
      }
      
      // Return mock data for other asset types
      return { name: `${workOrder.asset_type} Asset`, id: workOrder.asset_id };
    },
    enabled: !!workOrder?.asset_id
  });

  // Reset form when work order changes
  useEffect(() => {
    if (workOrder) {
      setMeterAtClose((workOrder as any).meter_close_miles?.toString() || "");
      setResolutionNotes((workOrder as any).resolution_notes || "");
      setReturnToService(false);
    }
  }, [workOrder]);

  // Save technician signature
  const saveSignatureMutation = useMutation({
    mutationFn: async ({ type, signatureData }: { type: string; signatureData: string }) => {
      if (!workOrderId) return;

      // Insert signature
      const { data: signature, error: sigError } = await supabase
        .from("work_order_signatures")
        .insert({
          work_order_id: workOrderId,
          signature_type: type,
          signed_by: user?.id,
          signature_data: signatureData
        })
        .select()
        .single();

      if (sigError) throw sigError;

      // Update work order with signature reference
      const updateField = type === "technician" ? "technician_signature_id" :
                         type === "reviewer" ? "reviewer_signature_id" : "driver_verification_id";
      
      const { error: woError } = await supabase
        .from("work_orders")
        .update({ [updateField]: signature.id })
        .eq("id", workOrderId);

      if (woError) throw woError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-order-detail", workOrderId] });
      toast({ title: "Signature saved" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save signature",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Complete work order
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!workOrderId || !workOrder) return;

      // Validation
      if (!meterAtClose && workOrder.asset_type === "vehicle") {
        throw new Error("Meter at close is required for vehicles");
      }
      if (!resolutionNotes) {
        throw new Error("Resolution notes are required");
      }
      if (!workOrder.technician_signature_id) {
        throw new Error("Technician signature is required");
      }

      // Update work order
      const updates: any = {
        status: "completed",
        closed_at: new Date().toISOString(),
        closed_by: user?.id,
        resolution_notes: resolutionNotes
      };

      if (meterAtClose) {
        updates.meter_close_miles = parseFloat(meterAtClose);
      }

      if (returnToService) {
        updates.return_to_service_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("work_orders")
        .update(updates)
        .eq("id", workOrderId);

      if (updateError) throw updateError;

      // If Return to Service is ON and vehicle is OOS, clear the OOS flag
      if (returnToService && workOrder.out_of_service && workOrder.asset_type === "vehicle") {
        await supabase
          .from("vehicles")
          .update({
            out_of_service: false,
            out_of_service_reason: null,
            out_of_service_since: null
          })
          .eq("id", workOrder.asset_id);
      }

      // Insert history record
      await safeInsert(
        "work_order_history",
        {
          work_order_id: workOrderId,
          from_status: workOrder.status,
          to_status: "completed",
          changed_by: user?.id,
          note: "Work order completed",
        },
        orgId
      );
    },
    onSuccess: () => {
      toast({ title: "Work order completed successfully" });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete work order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (!workOrder || isLoading) {
    return null;
  }

  const isCompleted = workOrder.status === "completed";
  const techSignature = workOrder.work_order_signatures?.find((s: any) => s.signature_type === "technician");
  const reviewerSignature = workOrder.work_order_signatures?.find((s: any) => s.signature_type === "reviewer");
  const driverSignature = workOrder.work_order_signatures?.find((s: any) => s.signature_type === "driver");

  // Calculate costs
  const partsCost = workOrder.work_order_parts?.reduce((sum: number, part: any) => 
    sum + (part.quantity * part.unit_cost), 0) || 0;
  const laborCost = workOrder.work_order_labor?.reduce((sum: number, labor: any) => 
    sum + (labor.hours * labor.hourly_rate), 0) || 0;
  const totalCost = partsCost + laborCost + (workOrder.external_cost || 0) + (workOrder.taxes_fees || 0);

  const isOverdue = workOrder.due_date && new Date(workOrder.due_date) < new Date() && !isCompleted;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DrawerTitle className="flex items-center gap-2">
                <span>{workOrder.work_order_number || `WO-${workOrder.id?.slice(-8)}`}</span>
                <Badge variant={
                  workOrder.status === "completed" ? "default" :
                  workOrder.status === "in_progress" ? "secondary" :
                  "outline"
                }>
                  {workOrder.status?.replace("_", " ")}
                </Badge>
                {workOrder.out_of_service && (
                  <Badge variant="destructive">Out of Service</Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportWorkOrderToPDF(workOrder)}
                  className="ml-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {(asset as any)?.license_plate || (asset as any)?.name || "Unknown Asset"}
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Priority: <Badge variant="outline" className="text-xs">{workOrder.priority}</Badge>
                </span>
                {workOrder.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {format(new Date(workOrder.due_date), "MMM d, yyyy")}
                  </span>
                )}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="work">
                <Wrench className="h-4 w-4 mr-2" />
                Work
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="costs">
                <DollarSign className="h-4 w-4 mr-2" />
                Costs
              </TabsTrigger>
            </TabsList>

            {/* Work Tab */}
            <TabsContent value="work" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {workOrder.description || "No description provided"}
                  </p>
                </CardContent>
              </Card>

              {(workOrder as any).tasks && (workOrder as any).tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(workOrder as any).tasks.map((task: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {workOrder.work_order_parts && workOrder.work_order_parts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Parts & Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {workOrder.work_order_parts.map((part: any) => (
                        <div key={part.id} className="flex items-center justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{part.part_name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {part.quantity}</p>
                          </div>
                          <span className="font-medium">${(part.quantity * part.unit_cost).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {workOrder.work_order_labor && workOrder.work_order_labor.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Labor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {workOrder.work_order_labor.map((labor: any) => (
                        <div key={labor.id} className="flex items-center justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{labor.technician_name || "Technician"}</p>
                            <p className="text-xs text-muted-foreground">{labor.hours} hours @ ${labor.hourly_rate}/hr</p>
                          </div>
                          <span className="font-medium">${(labor.hours * labor.hourly_rate).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Work Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Notes and attachments feature coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.work_order_history && workOrder.work_order_history.length > 0 ? (
                    <div className="space-y-3">
                      {workOrder.work_order_history.map((history: any) => (
                        <div key={history.id} className="flex gap-3 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">
                              {history.from_status ? `${history.from_status} → ` : ""}{history.to_status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(history.changed_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {history.note && (
                              <p className="text-xs text-muted-foreground mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No history available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Parts & Materials:</span>
                    <span className="font-medium">${partsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labor:</span>
                    <span className="font-medium">${laborCost.toFixed(2)}</span>
                  </div>
                  {workOrder.external_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>External/Vendor:</span>
                      <span className="font-medium">${workOrder.external_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {workOrder.taxes_fees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxes & Fees:</span>
                      <span className="font-medium">${workOrder.taxes_fees.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Cost:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Close-out Section */}
        {!isCompleted && (
          <Card className="sticky bottom-0 border-t-4 border-primary rounded-t-lg shadow-lg">
            <CardContent className="py-4 space-y-4">
              {workOrder.out_of_service && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Vehicle Out of Service</AlertTitle>
                  <AlertDescription>
                    Complete all repairs and toggle "Return to Service" before closing
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meter-close">Meter at Close {workOrder.asset_type === "vehicle" && "*"}</Label>
                  <Input
                    id="meter-close"
                    type="number"
                    placeholder={(workOrder as any).meter_at_open ? `Current: ${(workOrder as any).meter_at_open}` : "Enter meter reading"}
                    value={meterAtClose}
                    onChange={(e) => setMeterAtClose(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes *</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe the work completed and any additional notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignatureButton
                  label="Technician Signature"
                  signatureData={techSignature?.signature_data}
                  signedAt={techSignature?.signed_at}
                  onSign={(data) => saveSignatureMutation.mutate({ type: "technician", signatureData: data })}
                  required
                />

                <SignatureButton
                  label="Reviewer Approval"
                  signatureData={reviewerSignature?.signature_data}
                  signedAt={reviewerSignature?.signed_at}
                  onSign={(data) => saveSignatureMutation.mutate({ type: "reviewer", signatureData: data })}
                />
              </div>

              {workOrder.out_of_service && (
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <Switch
                    id="return-service"
                    checked={returnToService}
                    onCheckedChange={setReturnToService}
                  />
                  <Label htmlFor="return-service" className="cursor-pointer">
                    Return Vehicle to Service
                  </Label>
                </div>
              )}

              <Button
                onClick={() => completeMutation.mutate()}
                disabled={
                  completeMutation.isPending ||
                  !resolutionNotes ||
                  (workOrder.asset_type === "vehicle" && !meterAtClose) ||
                  !workOrder.technician_signature_id
                }
                className="w-full"
                size="lg"
              >
                {completeMutation.isPending ? "Completing..." : "Complete Work Order"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="border-t-4 border-green-600">
            <CardContent className="py-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Work Order Completed</AlertTitle>
                <AlertDescription>
                  Completed on {workOrder.closed_at && format(new Date(workOrder.closed_at), "MMM d, yyyy 'at' h:mm a")}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </DrawerContent>
    </Drawer>
  );
};
