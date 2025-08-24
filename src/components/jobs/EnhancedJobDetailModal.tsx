import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, User, Package, Camera, Shield, Target, AlertTriangle, X } from "lucide-react";

interface EnhancedJobDetailModalProps {
  jobId: string;
  open: boolean;
  onClose: () => void;
}

export const EnhancedJobDetailModal: React.FC<EnhancedJobDetailModalProps> = ({
  jobId,
  open,
  onClose
}) => {
  // Fetch job details with tool tracking information
  const { data: job } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          customers (name, email, phone),
          equipment_assignments (
            *,
            products (name),
            product_items (
              item_code,
              tool_number,
              vendor_id,
              plastic_code,
              verification_status,
              ocr_confidence_score,
              tracking_photo_url
            )
          ),
          job_consumables (
            *,
            consumables (name, sku)
          ),
          profiles (first_name, last_name)
        `)
        .eq("id", jobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!jobId
  });

  // Fetch job items separately to avoid nested relationship issues
  const { data: jobItems } = useQuery({
    queryKey: ["job-items", jobId],
    queryFn: async () => {
      // First, get basic job items
      const { data: items, error: itemsError } = await supabase
        .from("job_items")
        .select("*")
        .eq("job_id", jobId);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      // Get unique product and service IDs
      const productIds = [...new Set(items.filter(item => item.product_id).map(item => item.product_id))];
      const serviceIds = [...new Set(items.filter(item => item.service_id).map(item => item.service_id))];

      // Fetch products and services in parallel
      const [productsResult, servicesResult] = await Promise.all([
        productIds.length > 0 
          ? supabase.from("products").select("id, name").in("id", productIds)
          : { data: [], error: null },
        serviceIds.length > 0
          ? supabase.from("services").select("id, name").in("id", serviceIds)
          : { data: [], error: null }
      ]);

      if (productsResult.error) throw productsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      // Create lookup maps
      const productsMap = new Map<string, any>();
      const servicesMap = new Map<string, any>();
      
      if (productsResult.data) {
        productsResult.data.forEach(p => productsMap.set(p.id, p));
      }
      if (servicesResult.data) {
        servicesResult.data.forEach(s => servicesMap.set(s.id, s));
      }

      // Merge data
      return items.map(item => ({
        ...item,
        product: item.product_id ? productsMap.get(item.product_id) : null,
        service: item.service_id ? servicesMap.get(item.service_id) : null,
      }));
    },
    enabled: open && !!jobId
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      assigned: "bg-blue-100 text-blue-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.assigned}>
        {status}
      </Badge>
    );
  };

  const getVerificationBadge = (status: string | null, confidence: number | null) => {
    if (!status) return null;
    
    const badges = {
      manual_verified: <Badge className="bg-green-100 text-green-700"><Shield className="w-3 h-3 mr-1" />Verified</Badge>,
      auto_detected: confidence && confidence > 0.8 
        ? <Badge className="bg-blue-100 text-blue-700">Auto-detected</Badge>
        : <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>,
      needs_review: <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>
    };

    return badges[status as keyof typeof badges] || null;
  };

  if (!job) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Job Details: {job.job_number}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{new Date(job.scheduled_date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{job.scheduled_time || "No time specified"}</p>
                  <div className="mt-2">
                    {getStatusBadge(job.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{job.customers?.name}</p>
                  <p className="text-sm text-gray-600">{job.customers?.email}</p>
                  <p className="text-sm text-gray-600">{job.customers?.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{job.job_type}</p>
                  <p className="text-sm text-gray-600">
                    Driver: {job.profiles ? `${job.profiles.first_name} ${job.profiles.last_name}` : "Unassigned"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="equipment" className="space-y-4">
            <TabsList>
              <TabsTrigger value="equipment">Equipment & Tool Tracking</TabsTrigger>
              <TabsTrigger value="consumables">Consumables</TabsTrigger>
              <TabsTrigger value="notes">Notes & Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="equipment" className="space-y-4">
              {/* Equipment Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Equipment Assignments with Tool Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {job.equipment_assignments?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Tool Number</TableHead>
                          <TableHead>Vendor ID</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.equipment_assignments.map((assignment: any) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">
                              {assignment.products?.name || "Bulk Assignment"}
                            </TableCell>
                            <TableCell>
                              {assignment.product_items?.item_code || 
                                <Badge variant="outline">{assignment.quantity}x units</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              {assignment.product_items?.tool_number ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  <Target className="w-3 h-3 mr-1" />
                                  {assignment.product_items.tool_number}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.product_items?.vendor_id ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {assignment.product_items.vendor_id}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getVerificationBadge(
                                assignment.product_items?.verification_status,
                                assignment.product_items?.ocr_confidence_score
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(assignment.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No equipment assigned to this job</p>
                  )}

                  {/* Tool Tracking Summary */}
                  {job.equipment_assignments?.some((a: any) => a.product_items?.tool_number) && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Tool Tracking Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-700">Total Tracked:</span>
                          <p className="text-blue-600">
                            {job.equipment_assignments.filter((a: any) => a.product_items?.tool_number).length}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Verified:</span>
                          <p className="text-blue-600">
                            {job.equipment_assignments.filter((a: any) => 
                              a.product_items?.verification_status === "manual_verified"
                            ).length}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Auto-detected:</span>
                          <p className="text-blue-600">
                            {job.equipment_assignments.filter((a: any) => 
                              a.product_items?.verification_status === "auto_detected"
                            ).length}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Need Review:</span>
                          <p className="text-blue-600">
                            {job.equipment_assignments.filter((a: any) => 
                              a.product_items?.verification_status === "needs_review"
                            ).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Items (Inventory) */}
              {jobItems && jobItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Units to Deliver
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product?.name || item.service?.name || "Unknown Item"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.line_item_type === 'inventory' ? 'default' : 'secondary'}>
                                {item.line_item_type === 'inventory' ? 'Units' : item.line_item_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>${item.total_price?.toFixed(2) || '0.00'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="consumables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Consumables Used</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.job_consumables?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.job_consumables.map((consumable: any) => (
                          <TableRow key={consumable.id}>
                            <TableCell className="font-medium">
                              {consumable.consumables?.name}
                            </TableCell>
                            <TableCell>{consumable.consumables?.sku}</TableCell>
                            <TableCell>{consumable.quantity}</TableCell>
                            <TableCell>${consumable.unit_price}</TableCell>
                            <TableCell>${consumable.line_total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No consumables used in this job</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Notes & Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">General Notes</h4>
                        <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{job.notes}</p>
                      </div>
                    )}
                    
                    {job.special_instructions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                        <p className="text-gray-700 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          {job.special_instructions}
                        </p>
                      </div>
                    )}

                    {!job.notes && !job.special_instructions && (
                      <p className="text-gray-500 text-center py-8">No notes or special instructions for this job</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};