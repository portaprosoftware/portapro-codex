import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Package, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  stock_total: number;
  track_inventory: boolean;
  default_item_code_category?: string;
}

interface MigrationStatus {
  productId: string;
  productName: string;
  bulkCount: number;
  trackedCount: number;
  generated: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const BulkToTrackedMigrator = () => {
  const queryClient = useQueryClient();
  const [migrationStatuses, setMigrationStatuses] = useState<MigrationStatus[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-migration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_total, track_inventory, default_item_code_category')
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Calculate migration needs
  const { data: migrationNeeds = [] } = useQuery({
    queryKey: ['migration-needs', products],
    queryFn: async () => {
      const needs: MigrationStatus[] = [];
      
      for (const product of products) {
        // Get current tracked units count
        const { data: trackedUnits, error } = await supabase
          .from('product_items')
          .select('id')
          .eq('product_id', product.id);
        
        if (error) throw error;
        
        const trackedCount = trackedUnits?.length || 0;
        const neededUnits = Math.max(0, product.stock_total - trackedCount);
        
        needs.push({
          productId: product.id,
          productName: product.name,
          bulkCount: neededUnits,
          trackedCount,
          generated: 0,
          status: neededUnits > 0 ? 'pending' : 'complete'
        });
      }
      
      return needs;
    },
    enabled: products.length > 0
  });

  // Generate tracked units for a product
  const generateUnitsMutation = useMutation({
    mutationFn: async ({ productId, quantity, categoryPrefix }: { 
      productId: string; 
      quantity: number; 
      categoryPrefix?: string;
    }) => {
      const units = [];
      
      for (let i = 0; i < quantity; i++) {
        const { data: itemCode, error } = await supabase.rpc(
          'generate_item_code_with_category',
          { category_prefix: categoryPrefix || '1000' }
        );
        
        if (error) throw error;
        
        units.push({
          product_id: productId,
          item_code: itemCode,
          status: 'available',
          qr_code_data: itemCode
        });
      }
      
      // Batch insert units
      const { error: insertError } = await supabase
        .from('product_items')
        .insert(units);
      
      if (insertError) throw insertError;
      
      return { generated: quantity };
    }
  });

  // Auto-assign existing bulk reservations
  const assignBulkReservationsMutation = useMutation({
    mutationFn: async () => {
      // Get all bulk equipment assignments (those without product_item_id)
      const { data: bulkAssignments, error } = await supabase
        .from('equipment_assignments')
        .select('id, product_id, quantity, job_id')
        .is('product_item_id', null);
      
      if (error) throw error;
      
      let assignedCount = 0;
      
      for (const assignment of bulkAssignments || []) {
        // Get available units for this product
        const { data: availableUnits, error: unitsError } = await supabase
          .from('product_items')
          .select('id')
          .eq('product_id', assignment.product_id)
          .eq('status', 'available')
          .limit(assignment.quantity);
        
        if (unitsError) continue;
        
        // Assign specific units
        for (const unit of availableUnits || []) {
          const { error: reserveError } = await supabase.rpc('reserve_specific_item_for_job', {
            job_uuid: assignment.job_id,
            item_uuid: unit.id,
            assignment_date: new Date().toISOString().split('T')[0]
          });
          
          if (!reserveError) {
            assignedCount++;
          }
        }
        
        // Delete the old bulk assignment
        await supabase
          .from('equipment_assignments')
          .delete()
          .eq('id', assignment.id);
      }
      
      return { assignedCount };
    }
  });

  // Run full migration
  const runMigration = async () => {
    setIsMigrating(true);
    setMigrationStatuses(migrationNeeds.map(need => ({ ...need, status: 'pending' })));
    
    try {
      // Step 1: Generate tracked units for each product
      for (const need of migrationNeeds) {
        if (need.bulkCount === 0) continue;
        
        setMigrationStatuses(prev => prev.map(status => 
          status.productId === need.productId 
            ? { ...status, status: 'processing' }
            : status
        ));
        
        try {
          const product = products.find(p => p.id === need.productId);
          const categoryPrefix = product?.default_item_code_category || '1000';
          
          await generateUnitsMutation.mutateAsync({
            productId: need.productId,
            quantity: need.bulkCount,
            categoryPrefix
          });
          
          setMigrationStatuses(prev => prev.map(status => 
            status.productId === need.productId 
              ? { ...status, status: 'complete', generated: need.bulkCount }
              : status
          ));
        } catch (error: any) {
          setMigrationStatuses(prev => prev.map(status => 
            status.productId === need.productId 
              ? { ...status, status: 'error', error: error.message }
              : status
          ));
        }
      }
      
      // Step 2: Auto-assign existing bulk reservations
      toast.info('Converting bulk reservations to specific assignments...');
      await assignBulkReservationsMutation.mutateAsync();
      
      // Step 3: Mark all products as tracked
      const { error: updateError } = await supabase
        .from('products')
        .update({ track_inventory: true })
        .neq('track_inventory', true);
      
      if (updateError) throw updateError;
      
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment_assignments'] });
      
      toast.success('Migration completed successfully! All products are now fully tracked.');
      
    } catch (error: any) {
      toast.error(`Migration failed: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const totalUnitsToGenerate = migrationNeeds.reduce((sum, need) => sum + need.bulkCount, 0);
  const completedUnits = migrationStatuses.reduce((sum, status) => sum + status.generated, 0);
  const progress = totalUnitsToGenerate > 0 ? (completedUnits / totalUnitsToGenerate) * 100 : 100;

  if (isLoading) {
    return <div>Loading migration data...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Bulk to Tracked Migration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will convert all equipment to fully tracked inventory. Each product will have individual 
            units with QR codes, and all bulk reservations will be converted to specific unit assignments.
          </AlertDescription>
        </Alert>

        {/* Migration Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-blue-800">Total Products</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalUnitsToGenerate}</div>
            <div className="text-sm text-green-800">Units to Generate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {migrationNeeds.reduce((sum, need) => sum + need.trackedCount, 0)}
            </div>
            <div className="text-sm text-purple-800">Existing Tracked Units</div>
          </div>
        </div>

        {/* Progress Bar */}
        {isMigrating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Migration Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Product List */}
        <div className="space-y-2">
          <h3 className="font-medium">Products to Migrate:</h3>
          {migrationNeeds.map((need) => {
            const status = migrationStatuses.find(s => s.productId === need.productId) || need;
            
            return (
              <div key={need.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{need.productName}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {need.trackedCount} tracked, {need.bulkCount} to generate
                  </div>
                  
                  {status.status === 'complete' ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : status.status === 'processing' ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      Processing...
                    </Badge>
                  ) : status.status === 'error' ? (
                    <Badge className="bg-red-100 text-red-800">
                      Error
                    </Badge>
                  ) : need.bulkCount === 0 ? (
                    <Badge className="bg-gray-100 text-gray-800">
                      Already Tracked
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={runMigration}
            disabled={isMigrating || totalUnitsToGenerate === 0}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isMigrating ? (
              <>Processing Migration...</>
            ) : totalUnitsToGenerate === 0 ? (
              <>All Products Already Tracked</>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Migration ({totalUnitsToGenerate} units)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};