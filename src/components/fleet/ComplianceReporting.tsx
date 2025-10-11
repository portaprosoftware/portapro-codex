import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CheckCircle, FileText, CalendarIcon, Download, TrendingUp, AlertCircle, Package } from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { exportComplianceSummaryToPDF } from "@/utils/compliancePDFExport";
import { toast } from "sonner";

export const ComplianceReporting: React.FC = () => {
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date>(new Date());

  // Fetch all compliance data
  const { data: complianceData, isLoading } = useQuery({
    queryKey: ['compliance-summary', fromDate, toDate],
    queryFn: async () => {
      const fromISO = fromDate.toISOString();
      const toISO = toDate.toISOString();

      // Get all active vehicles with full details
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, nickname')
        .eq('status', 'active');

      // Get expired documents with type name and vehicle details
      const { data: expiredDocs } = await supabase
        .from('vehicle_compliance_documents')
        .select(`
          *,
          vehicles(license_plate, make, model, nickname),
          compliance_document_types(name)
        `)
        .lt('expiration_date', new Date().toISOString())
        .is('deleted_at', null);

      // Get expiring soon (next 30 days) with vehicle details
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { data: expiringSoon } = await supabase
        .from('vehicle_compliance_documents')
        .select(`
          *,
          vehicles(license_plate, make, model, nickname),
          compliance_document_types(name)
        `)
        .gte('expiration_date', new Date().toISOString())
        .lte('expiration_date', thirtyDaysFromNow.toISOString())
        .is('deleted_at', null);

      // Get recent spill kit checks
      const { data: recentChecks } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('*')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .is('deleted_at', null);

      // Get recent incidents with vehicle details
      const { data: recentIncidents } = await supabase
        .from('spill_incidents')
        .select(`
          *,
          vehicles(license_plate, make, model, nickname),
          configurable_spill_types(name)
        `)
        .gte('occurred_at', fromISO)
        .lte('occurred_at', toISO)
        .is('deleted_at', null);

      // Get active incidents with vehicle details
      const { data: activeIncidents } = await supabase
        .from('spill_incidents')
        .select(`
          *,
          vehicles(license_plate, make, model, nickname),
          configurable_spill_types(name)
        `)
        .in('status', ['reported', 'investigating'])
        .is('deleted_at', null);

      // Get recent decon logs
      const { data: recentDecon } = await supabase
        .from('decon_logs')
        .select('*')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);

      // Get recent documents uploaded
      const { data: recentDocs } = await supabase
        .from('vehicle_compliance_documents')
        .select('*')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .is('deleted_at', null);

      // Get low stock spill kit items
      const { data: lowStock } = await supabase
        .from('spill_kit_inventory')
        .select('*')
        .filter('current_stock', 'lte', 'minimum_threshold');

      // Get overdue inspections (no check in last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: allChecks } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('vehicle_id, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const latestChecksByVehicle = new Map();
      allChecks?.forEach(check => {
        if (!latestChecksByVehicle.has(check.vehicle_id)) {
          latestChecksByVehicle.set(check.vehicle_id, check);
        }
      });

      const overdueVehicles = vehicles?.filter(v => {
        const lastCheck = latestChecksByVehicle.get(v.id);
        return !lastCheck || new Date(lastCheck.created_at) < thirtyDaysAgo;
      }).map(v => ({
        id: v.id,
        license_plate: v.license_plate,
        make: v.make,
        model: v.model,
        nickname: v.nickname,
        lastCheckDate: latestChecksByVehicle.get(v.id)?.created_at || null,
      })) || [];

      return {
        vehicles: vehicles || [],
        expiredDocs: expiredDocs || [],
        expiringSoon: expiringSoon || [],
        recentChecks: recentChecks || [],
        recentIncidents: recentIncidents || [],
        activeIncidents: activeIncidents || [],
        recentDecon: recentDecon || [],
        recentDocs: recentDocs || [],
        lowStock: lowStock || [],
        overdueVehicles,
      };
    },
  });

  // Calculate summary metrics
  const summary = React.useMemo(() => {
    if (!complianceData) return null;

    const totalVehicles = complianceData.vehicles.length;
    const criticalCount = complianceData.expiredDocs.length + complianceData.overdueVehicles.length + complianceData.activeIncidents.length;
    
    // Calculate health score
    const vehiclesWithIssues = new Set([
      ...complianceData.expiredDocs.map(d => d.vehicle_id),
      ...complianceData.activeIncidents.map(i => i.vehicle_id),
      ...complianceData.overdueVehicles.map(v => v.id),
    ]).size;
    
    const healthScore = totalVehicles > 0 ? ((totalVehicles - vehiclesWithIssues) / totalVehicles) * 100 : 100;

    // Build action items
    const actionItems: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      vehicle?: string;
      dueDate?: Date;
    }> = [];

    // High priority: Expired docs
    complianceData.expiredDocs.forEach((doc: any) => {
      actionItems.push({
        priority: 'high',
        description: `Renew expired ${doc.compliance_document_types?.name || 'document'}`,
        vehicle: doc.vehicles?.license_plate,
        dueDate: new Date(doc.expiration_date),
      });
    });

    // High priority: Active incidents
    complianceData.activeIncidents.forEach((incident: any) => {
      actionItems.push({
        priority: 'high',
        description: `Resolve ${incident.configurable_spill_types?.name || 'incident'}`,
        vehicle: incident.vehicles?.license_plate,
      });
    });

    // Medium priority: Expiring soon
    complianceData.expiringSoon.slice(0, 5).forEach((doc: any) => {
      actionItems.push({
        priority: 'medium',
        description: `Renew ${doc.compliance_document_types?.name || 'document'} before expiration`,
        vehicle: doc.vehicles?.license_plate,
        dueDate: new Date(doc.expiration_date),
      });
    });

    // Medium priority: Overdue inspections
    complianceData.overdueVehicles.forEach(vehicle => {
      actionItems.push({
        priority: 'medium',
        description: `Complete overdue spill kit inspection`,
        vehicle: vehicle.license_plate,
      });
    });

    // Low priority: Low stock
    complianceData.lowStock.forEach(item => {
      actionItems.push({
        priority: 'low',
        description: `Reorder ${item.item_name}`,
      });
    });

    return {
      totalVehicles,
      criticalCount,
      healthScore,
      actionItems: actionItems.slice(0, 10), // Limit to top 10
    };
  }, [complianceData]);

  const handleDownloadPDF = () => {
    if (!complianceData || !summary) {
      toast.error("No data available to export");
      return;
    }

    const pdfData = {
      dateRange: { from: fromDate, to: toDate },
      fleetHealthScore: summary.healthScore,
      totalVehicles: summary.totalVehicles,
      criticalItems: {
        expiredDocuments: complianceData.expiredDocs.map((doc: any) => {
          const vehicle = doc.vehicles;
          return {
            vehicle: vehicle?.license_plate || 'Unknown',
            vehicleName: vehicle?.make && vehicle?.model 
              ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
              : vehicle?.license_plate || 'Unknown',
            docType: doc.compliance_document_types?.name || 'Unknown',
            daysOverdue: Math.abs(differenceInDays(new Date(), new Date(doc.expiration_date))),
          };
        }),
        overdueInspections: complianceData.overdueVehicles.map(v => {
          return {
            vehicle: v.license_plate || 'Unknown',
            vehicleName: v.make && v.model 
              ? `${v.make} ${v.model}${v.nickname ? ` - ${v.nickname}` : ''}`
              : v.license_plate || 'Unknown',
            lastCheckDate: v.lastCheckDate ? new Date(v.lastCheckDate) : null,
            daysOverdue: v.lastCheckDate 
              ? Math.abs(differenceInDays(new Date(), new Date(v.lastCheckDate)))
              : null,
          };
        }),
        activeIncidents: complianceData.activeIncidents.map((inc: any) => {
          const vehicle = inc.vehicles;
          return {
            vehicle: vehicle?.license_plate || 'Unknown',
            vehicleName: vehicle?.make && vehicle?.model 
              ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
              : vehicle?.license_plate || 'Unknown',
            incidentType: inc.configurable_spill_types?.name || 'Unknown',
            date: new Date(inc.occurred_at),
          };
        }),
      },
      expiringSoon: complianceData.expiringSoon.map((doc: any) => {
        const vehicle = doc.vehicles;
        return {
          vehicle: vehicle?.license_plate || 'Unknown',
          vehicleName: vehicle?.make && vehicle?.model 
            ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
            : vehicle?.license_plate || 'Unknown',
          itemType: doc.compliance_document_types?.name || 'Unknown',
          expirationDate: new Date(doc.expiration_date),
          daysUntilDue: differenceInDays(new Date(doc.expiration_date), new Date()),
        };
      }),
      recentActivity: {
        newInspections: complianceData.recentChecks.length,
        newIncidents: complianceData.recentIncidents.length,
        newDeconLogs: complianceData.recentDecon.length,
        documentsUploaded: complianceData.recentDocs.length,
      },
      lowStockAlerts: complianceData.lowStock.map(item => ({
        itemName: item.item_name || 'Unknown',
        currentStock: item.current_stock || 0,
        minThreshold: item.minimum_threshold || 0,
      })),
      actionItems: summary.actionItems,
    };

    exportComplianceSummaryToPDF(pdfData);
    toast.success("Compliance report downloaded");
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance Summary Report</h1>
          <p className="text-muted-foreground">Fleet compliance overview and action items</p>
        </div>
        
        <Button onClick={handleDownloadPDF} disabled={isLoading || !summary}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              From: {format(fromDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={fromDate} onSelect={(date) => date && setFromDate(date)} initialFocus className="pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              To: {format(toDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={toDate} onSelect={(date) => date && setToDate(date)} initialFocus className="pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading compliance data...</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fleet Health Score</p>
                    <p className={cn("text-2xl font-bold", getHealthColor(summary.healthScore))}>
                      {summary.healthScore.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                    <p className="text-2xl font-bold">{summary.totalVehicles}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Items</p>
                    <p className="text-2xl font-bold text-red-600">{summary.criticalCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">{complianceData?.expiringSoon.length || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Items */}
          {summary.criticalCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Items Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData?.expiredDocs.map((doc: any, idx) => {
                    const vehicle = doc.vehicles;
                    const vehicleName = vehicle?.make && vehicle?.model 
                      ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
                      : vehicle?.license_plate || 'Unknown';
                    
                    return (
                      <div key={idx} className="flex items-start justify-between p-3 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium">{vehicleName}</p>
                          <p className="text-sm text-muted-foreground">{vehicle?.license_plate}</p>
                          <p className="text-sm text-muted-foreground mt-1">Expired: {doc.compliance_document_types?.name || 'Document'}</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 rounded-md">
                          <span className="text-white font-bold text-sm">
                            {Math.abs(differenceInDays(new Date(), new Date(doc.expiration_date)))} Days Overdue
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {complianceData?.activeIncidents.map((incident: any, idx) => {
                    const vehicle = incident.vehicles;
                    const vehicleName = vehicle?.make && vehicle?.model 
                      ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
                      : vehicle?.license_plate || 'Unknown';
                    
                    return (
                      <div key={idx} className="flex items-start justify-between p-3 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium">{vehicleName}</p>
                          <p className="text-sm text-muted-foreground">{vehicle?.license_plate}</p>
                          <p className="text-sm text-muted-foreground mt-1">Active Incident: {incident.configurable_spill_types?.name || 'Incident'}</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 rounded-md">
                          <span className="text-white font-bold text-sm">Action Required</span>
                        </div>
                      </div>
                    );
                  })}
                  {complianceData?.overdueVehicles.map((vehicle, idx) => {
                    const vehicleName = vehicle.make && vehicle.model 
                      ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
                      : vehicle.license_plate || 'Unknown';
                    
                    return (
                      <div key={`overdue-${idx}`} className="flex items-start justify-between p-3 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium">{vehicleName}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Overdue Spill Kit Inspection
                            {vehicle.lastCheckDate && 
                              ` - Last checked ${format(new Date(vehicle.lastCheckDate), 'MMM dd, yyyy')}`
                            }
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 rounded-md">
                          <span className="text-white font-bold text-sm">
                            {vehicle.lastCheckDate 
                              ? `${Math.abs(differenceInDays(new Date(), new Date(vehicle.lastCheckDate)))} Days Overdue`
                              : 'Never Inspected'
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiring Soon */}
          {complianceData && complianceData.expiringSoon.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Expiring in Next 30 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData.expiringSoon.slice(0, 10).map((doc: any, idx) => {
                    const vehicle = doc.vehicles;
                    const vehicleName = vehicle?.make && vehicle?.model 
                      ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
                      : vehicle?.license_plate || 'Unknown';
                    
                    return (
                      <div key={idx} className="flex items-start justify-between p-3 border border-yellow-200 rounded-lg">
                        <div>
                          <p className="font-medium">{vehicleName}</p>
                          <p className="text-sm text-muted-foreground">{vehicle?.license_plate}</p>
                          <p className="text-sm text-muted-foreground mt-1">{doc.compliance_document_types?.name || 'Document'}</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-1 rounded-md">
                          <span className="text-white font-bold text-sm">
                            {differenceInDays(new Date(doc.expiration_date), new Date())} Days Left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>
                Recent Activity ({format(fromDate, 'MMM dd')} - {format(toDate, 'MMM dd')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{complianceData?.recentChecks.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Spill Kit Inspections</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{complianceData?.recentIncidents.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Incidents Reported</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{complianceData?.recentDecon.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Decon Logs Filed</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{complianceData?.recentDocs.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          {complianceData && complianceData.lowStock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData.lowStock.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.current_stock} | Min: {item.minimum_threshold}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 rounded-md">
                        <span className="text-white font-bold text-sm">Reorder Needed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {summary.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Priority Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.actionItems.map((item, idx) => {
                    const priorityGradient = item.priority === 'high' 
                      ? 'from-red-500 to-red-600' 
                      : item.priority === 'medium' 
                      ? 'from-blue-500 to-blue-600' 
                      : 'from-gray-500 to-gray-600';
                    const borderColor = item.priority === 'high' ? 'border-red-200' : item.priority === 'medium' ? 'border-blue-200' : 'border-gray-200';
                    const priorityLabel = item.priority.charAt(0).toUpperCase() + item.priority.slice(1);
                    
                    return (
                      <div key={idx} className={cn("flex items-start gap-3 p-3 border rounded-lg", borderColor)}>
                        <span className="font-bold text-gray-700">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          {item.vehicle && <p className="text-sm text-muted-foreground">Vehicle: {item.vehicle}</p>}
                          {item.dueDate && <p className="text-sm text-muted-foreground">Due: {format(item.dueDate, 'MMM dd, yyyy')}</p>}
                        </div>
                        <div className={cn("bg-gradient-to-r px-3 py-1 rounded-md", priorityGradient)}>
                          <span className="text-white font-bold text-sm">{priorityLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
