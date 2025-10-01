import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, FileText, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  vehicleId: string;
  incidentDate: string;
}

/**
 * Shows integration points for an incident:
 * - DVIR (Daily Vehicle Inspection Report) if one exists for this vehicle/date
 * - Spill Kit Check status
 * - Related maintenance work orders
 */
export const IncidentIntegrations: React.FC<Props> = ({ vehicleId, incidentDate }) => {
  // Check for DVIR on the incident date
  const { data: dvir } = useQuery({
    queryKey: ['dvir', vehicleId, incidentDate],
    queryFn: async () => {
      const date = new Date(incidentDate).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('inspection_date', date)
        .lte('inspection_date', date)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Check spill kit status
  const { data: spillKitCheck } = useQuery({
    queryKey: ['spill-kit', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // No integrations found
  if (!dvir && !spillKitCheck) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          Related Compliance Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* DVIR Integration */}
        {dvir && (
          <div className="flex items-start justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Daily Vehicle Inspection (DVIR)</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(dvir.inspection_date), "MMM d, yyyy")} • 
                  {dvir.passed ? "Passed" : "Issues Found"}
                </div>
                {!dvir.passed && (
                  <Badge variant="destructive" className="mt-1">
                    Issues Found
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Spill Kit Integration */}
        {spillKitCheck && (
          <div className="flex items-start justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Spill Kit Check</div>
                <div className="text-xs text-muted-foreground">
                  Last checked: {format(new Date(spillKitCheck.created_at), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {spillKitCheck.has_kit ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-700">Kit Present</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-700">Kit Missing</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};