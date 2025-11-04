import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DVIRForm } from "./DVIRForm";
import { DVIRDefectBadge } from "./dvir/DVIRDefectBadge";
import { DVIRDefectsList } from "./dvir/DVIRDefectsList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

interface DVIRListProps {
  vehicleId?: string;
  licensePlate?: string;
}

export const DVIRList: React.FC<DVIRListProps> = ({ vehicleId, licensePlate }) => {
  const [open, setOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dvir-reports", vehicleId],
    queryFn: async () => {
      let query = supabase
        .from("dvir_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      // Filter by vehicleId if provided
      if (vehicleId) {
        query = query.eq("asset_id", vehicleId).eq("asset_type", "vehicle");
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const toggleRow = (dvirId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(dvirId)) {
      newExpanded.delete(dvirId);
    } else {
      newExpanded.add(dvirId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Driver Vehicle Inspection Reports</h2>
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
            <div className="space-y-3">
              {data!.map((r: any) => {
                const hasDefects = r.defects_count > 0;
                const isExpanded = expandedRows.has(r.id);

                return (
                  <Card key={r.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        {hasDefects && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleRow(r.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="text-sm font-medium">
                              {new Date(r.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleTimeString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Asset</p>
                            <p className="text-sm">
                              {r.asset_type}: {r.asset_id?.slice(0, 8)}…
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <Badge variant="outline" className="text-xs">
                              {r.type}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge className="text-xs">{r.status}</Badge>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Defects</p>
                            {r.defects_count > 0 ? (
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={r.major_defect_present ? "destructive" : "secondary"}
                                  className="text-xs font-bold"
                                >
                                  {r.defects_count}
                                </Badge>
                                <DVIRDefectBadge 
                                  dvirId={r.id}
                                  onWorkOrderClick={(woId) => {
                                    console.log('Open WO:', woId);
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">None</span>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Odometer</p>
                            <p className="text-sm">
                              {r.odometer_miles ? `${r.odometer_miles.toLocaleString()} mi` : "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Out of Service</p>
                            {r.out_of_service_flag ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertCircle className="h-3 w-3" />
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">No</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Defects Section */}
                    {hasDefects && isExpanded && (
                      <div className="border-t bg-muted/30 p-4">
                        <DVIRDefectsList
                          dvirId={r.id}
                          assetId={r.asset_id}
                          assetType={r.asset_type}
                          onWorkOrderCreated={() => refetch()}
                        />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No Driver Vehicle Inspection Reports yet</p>
          )}
        </CardContent>
      </Card>

      <DVIRForm 
        open={open} 
        onOpenChange={(v)=>{ setOpen(v); if(!v) refetch(); }} 
        preSelectedVehicleId={vehicleId}
        useModal={!!vehicleId}
      />
    </div>
  );
};