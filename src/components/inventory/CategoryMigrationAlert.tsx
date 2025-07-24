import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { checkMigrationNeeded, migrateConsumableCategories, MigrationResult } from '@/lib/migrateCategoriesUtil';
import { toast } from '@/hooks/use-toast';

export const CategoryMigrationAlert: React.FC = () => {
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  const { data: migrationStatus, isLoading, refetch } = useQuery({
    queryKey: ['category-migration-check'],
    queryFn: checkMigrationNeeded
  });

  const migrationMutation = useMutation({
    mutationFn: migrateConsumableCategories,
    onSuccess: (result) => {
      setMigrationResult(result);
      if (result.success) {
        toast({
          title: 'Migration Completed',
          description: `Successfully migrated ${result.migratedCount} consumables to new categories.`
        });
        refetch();
      } else {
        toast({
          title: 'Migration Issues',
          description: `Migration completed with ${result.errors.length} errors. Check details below.`,
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Migration Failed',
        description: `Failed to run migration: ${error}`,
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return null;
  }

  // Don't show if no migration is needed
  if (!migrationStatus?.needed) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Category Migration Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            We've updated the consumable categories system. {migrationStatus.count} items use old category names 
            and can be automatically migrated to the new consolidated categories.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">Categories that will be updated:</p>
          <div className="flex flex-wrap gap-2">
            {migrationStatus.categories.map(category => (
              <Badge key={category} variant="outline" className="bg-white">
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => migrationMutation.mutate()}
            disabled={migrationMutation.isPending}
            className="flex items-center gap-2"
          >
            {migrationMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {migrationMutation.isPending ? 'Migrating...' : 'Migrate Now'}
          </Button>
          
          <Button variant="outline" onClick={() => refetch()}>
            Refresh Status
          </Button>
        </div>

        {migrationResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              {migrationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                Migration Result: {migrationResult.migratedCount} items updated
              </span>
            </div>

            {migrationResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {migrationResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {migrationResult.details.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Updated Items:</p>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {migrationResult.details.map(detail => (
                    <div key={detail.id} className="flex items-center gap-2">
                      <span>{detail.name}</span>
                      <span className="text-gray-500">
                        {detail.oldCategory} → {detail.newCategory}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};