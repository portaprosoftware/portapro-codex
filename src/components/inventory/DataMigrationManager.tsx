import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Move, 
  Shield,
  Wrench,
  RefreshCw,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface MigrationResult {
  success: boolean;
  migrated_consumables?: number;
  default_location_id?: string;
  message?: string;
  error?: string;
}

interface ValidationResult {
  success: boolean;
  total_issues: number;
  issues: Array<{
    type: string;
    consumable_id?: string;
    consumable_name?: string;
    location_id?: string;
    location_name?: string;
    master_stock?: number;
    location_total?: number;
    difference?: number;
    consumable_count?: number;
  }>;
}

interface FixResult {
  success: boolean;
  fixes_applied: number;
  message?: string;
  error?: string;
}

interface ReportResult {
  success: boolean;
  report_date: string;
  summary: {
    total_locations: number;
    total_consumable_types: number;
    total_stock_value: number;
  };
  location_details: Array<{
    location_id: string;
    location_name: string;
    description?: string;
    is_default: boolean;
    consumable_types: number;
    total_units: number;
    total_value: number;
  }>;
}

export function DataMigrationManager() {
  const [activeTab, setActiveTab] = useState<'migrate' | 'validate' | 'fix' | 'report'>('migrate');
  const queryClient = useQueryClient();

  // Migration mutation
  const migrationMutation = useMutation({
    mutationFn: async (): Promise<MigrationResult> => {
      const { data, error } = await supabase.rpc('migrate_consumables_to_default_location');
      if (error) throw error;
      return data as unknown as MigrationResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Migration completed successfully");
        queryClient.invalidateQueries({ queryKey: ['consumables'] });
        queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      } else {
        toast.error(data.error || "Migration failed");
      }
    },
    onError: (error) => {
      toast.error(`Migration failed: ${error.message}`);
    }
  });

  // Validation query
  const { data: validationData, refetch: refetchValidation, isLoading: isValidating } = useQuery({
    queryKey: ['storage-validation'],
    queryFn: async (): Promise<ValidationResult> => {
      const { data, error } = await supabase.rpc('validate_storage_location_integrity');
      if (error) throw error;
      return data as unknown as ValidationResult;
    },
    enabled: activeTab === 'validate'
  });

  // Auto-fix mutation
  const autoFixMutation = useMutation({
    mutationFn: async (): Promise<FixResult> => {
      const { data, error } = await supabase.rpc('auto_fix_storage_location_issues');
      if (error) throw error;
      return data as unknown as FixResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || `Applied ${data.fixes_applied} fixes`);
        refetchValidation();
        queryClient.invalidateQueries({ queryKey: ['consumables'] });
      } else {
        toast.error(data.error || "Auto-fix failed");
      }
    },
    onError: (error) => {
      toast.error(`Auto-fix failed: ${error.message}`);
    }
  });

  // Report query
  const { data: reportData, refetch: refetchReport, isLoading: isGeneratingReport } = useQuery({
    queryKey: ['storage-report'],
    queryFn: async (): Promise<ReportResult> => {
      const { data, error } = await supabase.rpc('generate_storage_location_report');
      if (error) throw error;
      return data as unknown as ReportResult;
    },
    enabled: activeTab === 'report'
  });

  const handleExportReport = () => {
    if (!reportData) return;
    
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage-location-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'stock_mismatch':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'inactive_location_with_stock':
        return <Shield className="h-4 w-4 text-destructive" />;
      case 'missing_default_location':
        return <Database className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getIssueDescription = (issue: ValidationResult['issues'][0]) => {
    switch (issue.type) {
      case 'stock_mismatch':
        return `${issue.consumable_name}: Master stock (${issue.master_stock}) doesn't match location total (${issue.location_total}). Difference: ${issue.difference}`;
      case 'inactive_location_with_stock':
        return `${issue.location_name}: Inactive location has ${issue.consumable_count} consumable types in stock`;
      case 'missing_default_location':
        return `${issue.consumable_name}: Missing default storage location assignment`;
      default:
        return "Unknown issue type";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={activeTab === 'migrate' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('migrate')}
          className="flex items-center gap-2"
        >
          <Move className="h-4 w-4" />
          Migrate
        </Button>
        <Button
          variant={activeTab === 'validate' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('validate')}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Validate
        </Button>
        <Button
          variant={activeTab === 'fix' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('fix')}
          className="flex items-center gap-2"
        >
          <Wrench className="h-4 w-4" />
          Auto-Fix
        </Button>
        <Button
          variant={activeTab === 'report' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('report')}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Report
        </Button>
      </div>

      {/* Migration Tab */}
      {activeTab === 'migrate' && (
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Data Migration
          </CardTitle>
            <CardDescription>
              Migrate existing consumable inventory to location-based storage system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                This will create a default storage location and assign all existing consumable stock to it.
                This operation is safe and can be run multiple times.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={() => migrationMutation.mutate()}
              disabled={migrationMutation.isPending}
              className="w-full"
            >
              {migrationMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Move className="h-4 w-4 mr-2" />
                  Start Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Validation Tab */}
      {activeTab === 'validate' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Validation
            </CardTitle>
            <CardDescription>
              Check storage location data integrity and identify issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Last validation: {validationData ? "Just now" : "Never"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchValidation()}
                disabled={isValidating}
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>

            {validationData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {validationData.total_issues === 0 ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    )}
                    <span className="font-medium">
                      {validationData.total_issues === 0 
                        ? "No issues found" 
                        : `${validationData.total_issues} issues found`
                      }
                    </span>
                  </div>
                  <Badge variant={validationData.total_issues === 0 ? "default" : "destructive"}>
                    {validationData.total_issues === 0 ? "Healthy" : "Needs Attention"}
                  </Badge>
                </div>

                {validationData.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Issues Found:</h4>
                    {validationData.issues.map((issue, index) => (
                      <Alert key={index}>
                        {getIssueIcon(issue.type)}
                        <AlertDescription className="ml-2">
                          {getIssueDescription(issue)}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-Fix Tab */}
      {activeTab === 'fix' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Auto-Fix Issues
            </CardTitle>
            <CardDescription>
              Automatically resolve common storage location data issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Wrench className="h-4 w-4" />
              <AlertDescription>
                This will automatically fix issues like missing default locations and sync master stock with location totals.
                Changes will be logged for audit purposes.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={() => autoFixMutation.mutate()}
              disabled={autoFixMutation.isPending}
              className="w-full"
            >
              {autoFixMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Applying Fixes...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Apply Auto-Fixes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Location Report
            </CardTitle>
            <CardDescription>
              Generate comprehensive storage location analytics and summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchReport()}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Generate Report
              </Button>
              {reportData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              )}
            </div>

            {reportData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{reportData.summary.total_locations}</div>
                      <div className="text-sm text-muted-foreground">Active Locations</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{reportData.summary.total_consumable_types}</div>
                      <div className="text-sm text-muted-foreground">Consumable Types</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        ${reportData.summary.total_stock_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Stock Value</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Location Details:</h4>
                  {reportData.location_details.map((location) => (
                    <Card key={location.location_id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{location.location_name}</h5>
                              {location.is_default && (
                                <Badge variant="outline">Default</Badge>
                              )}
                            </div>
                            {location.description && (
                              <p className="text-sm text-muted-foreground">{location.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              {location.consumable_types} types • {location.total_units} units
                            </div>
                            <div className="text-sm font-medium">
                              ${location.total_value.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}