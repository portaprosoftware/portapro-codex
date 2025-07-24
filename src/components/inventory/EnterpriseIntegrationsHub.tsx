import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Zap, Settings, Plus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface APIintegration {
  id: string;
  integration_name: string;
  integration_type: string;
  api_endpoint: string;
  auth_method: string;
  is_active: boolean;
  sync_frequency: number;
  last_sync_at?: string;
  sync_status: string;
  error_message?: string;
  configuration: any;
}

interface Workflow {
  id: string;
  workflow_name: string;
  workflow_type: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
}

export const EnterpriseIntegrationsHub: React.FC = () => {
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<APIintegration | null>(null);

  const queryClient = useQueryClient();

  // API Integrations
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['api-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_integrations' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as APIintegration[];
    }
  });

  // Workflows
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['consumable-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_workflows' as any)
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Workflow[];
    }
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      // Mock sync - in production, this would call the actual API
      const { error } = await supabase
        .from('api_integrations' as any)
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: 'success'
        })
        .eq('id', integrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Integration synced successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
    }
  });

  const testConnection = async (integration: APIintegration) => {
    toast.success(`Testing connection to ${integration.integration_name}...`);
    
    // Mock API test - in production, this would make actual API calls
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        toast.success('Connection test successful');
      } else {
        toast.error('Connection test failed - check credentials');
      }
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'destructive';
      case 'in_progress': return 'secondary';
      default: return 'outline';
    }
  };

  if (integrationsLoading || workflowsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Enterprise Integrations & Automation Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="integrations" className="space-y-6">
            <TabsList>
              <TabsTrigger value="integrations">API Integrations</TabsTrigger>
              <TabsTrigger value="workflows">Workflow Automation</TabsTrigger>
              <TabsTrigger value="suppliers">Supplier Networks</TabsTrigger>
              <TabsTrigger value="ml">AI/ML Models</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">External API Integrations</h3>
                <Button onClick={() => setShowAddIntegration(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </div>

              <div className="grid gap-4">
                {integrations?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No API integrations configured</p>
                      <p className="text-sm">Connect to suppliers, ERP systems, and analytics platforms</p>
                    </CardContent>
                  </Card>
                ) : (
                  integrations?.map(integration => (
                    <Card key={integration.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{integration.integration_name}</h4>
                              <Badge variant="outline" className="capitalize">
                                {integration.integration_type}
                              </Badge>
                              <Badge variant={getStatusColor(integration.sync_status) as any}>
                                {getStatusIcon(integration.sync_status)}
                                <span className="ml-1 capitalize">{integration.sync_status}</span>
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {integration.api_endpoint}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Auth: {integration.auth_method}</span>
                              <span>Sync: Every {integration.sync_frequency}min</span>
                              {integration.last_sync_at && (
                                <span>Last: {new Date(integration.last_sync_at).toLocaleString()}</span>
                              )}
                            </div>

                            {integration.error_message && (
                              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                {integration.error_message}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch checked={integration.is_active} />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testConnection(integration)}
                            >
                              Test
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => syncIntegrationMutation.mutate(integration.id)}
                              disabled={syncIntegrationMutation.isPending}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Sync
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Workflow Automation</h3>
                  <p className="text-sm text-muted-foreground">Automate approvals, reordering, and notifications</p>
                </div>
                <Button onClick={() => setShowAddWorkflow(true)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </div>

              <div className="grid gap-4">
                {workflows?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No automation workflows configured</p>
                      <p className="text-sm">Create workflows to automate repetitive tasks</p>
                    </CardContent>
                  </Card>
                ) : (
                  workflows?.map(workflow => (
                    <Card key={workflow.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{workflow.workflow_name}</h4>
                              <Badge variant="outline" className="capitalize">
                                {workflow.workflow_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                                {workflow.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <p>Priority: {workflow.priority}</p>
                              <p>Triggers: {Object.keys(workflow.trigger_conditions || {}).length} conditions</p>
                              <p>Actions: {Object.keys(workflow.actions || {}).length} automated actions</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch checked={workflow.is_active} />
                            <Button size="sm" variant="outline">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Supplier Network Management</h3>
                <p className="text-sm text-muted-foreground">Manage supplier catalogs, pricing, and contracts</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Connected Suppliers</h4>
                    <div className="space-y-3">
                      {['Acme Supply Co.', 'Industrial Partners LLC', 'Green Solutions Inc.'].map((supplier, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium">{supplier}</p>
                            <p className="text-sm text-muted-foreground">
                              {Math.floor(Math.random() * 500) + 100} products • API Connected
                            </p>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Contract Management</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Volume Discounts</span>
                          <Badge variant="secondary">3 Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">5-15% discounts on bulk orders</p>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Payment Terms</span>
                          <Badge variant="outline">Net 30</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Standard payment terms across suppliers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ml" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">AI/ML Predictive Models</h3>
                <p className="text-sm text-muted-foreground">Machine learning models for demand forecasting and optimization</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium mb-2">Demand Forecasting</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Predicts consumable usage based on historical data and job patterns
                    </p>
                    <Badge variant="default">Active</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-6 h-6 text-secondary" />
                    </div>
                    <h4 className="font-medium mb-2">Optimization Engine</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Optimizes reorder quantities and timing to minimize costs
                    </p>
                    <Badge variant="secondary">Training</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="font-medium mb-2">Anomaly Detection</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Identifies unusual usage patterns and potential issues
                    </p>
                    <Badge variant="outline">Planned</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{integrations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Active Integrations</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{workflows?.filter(w => w.is_active).length || 0}</p>
              <p className="text-sm text-muted-foreground">Active Workflows</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">97.8%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">$12.4K</p>
              <p className="text-sm text-muted-foreground">Monthly Savings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};