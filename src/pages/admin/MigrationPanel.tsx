import React from 'react';
import { BulkToTrackedMigrator } from '@/components/admin/BulkToTrackedMigrator';

export default function MigrationPanel() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Migration</h1>
          <p className="text-gray-600">Convert bulk inventory to fully tracked units</p>
        </div>
        
        <BulkToTrackedMigrator />
      </div>
    </div>
  );
}