import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsumablesDashboard } from './ConsumablesDashboard';
import { AddConsumableModal } from './AddConsumableModal';
import { EditConsumableModal } from './EditConsumableModal';
import { ReceiveStockModal } from './ReceiveStockModal';
import { ConsumableQRGenerator } from './ConsumableQRGenerator';
import { ConsumableRequestsManager } from './ConsumableRequestsManager';
import { JobConsumablesTracker } from './JobConsumablesTracker';
import { ConsumableNotificationsPanel } from './ConsumableNotificationsPanel';
import { AdvancedConsumableAnalytics } from './AdvancedConsumableAnalytics';
import { ConsumablePWAManager } from './ConsumablePWAManager';
import { EnterpriseIntegrationsHub } from './EnterpriseIntegrationsHub';
import { RealTimeCollaborationSystem } from './RealTimeCollaborationSystem';
import { EnterpriseReportingSystem } from './EnterpriseReportingSystem';
import { ConsumablesReportsTab } from './ConsumablesReportsTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, QrCode, Bell, MapPin, Package, BarChart3, Smartphone, Globe, Users, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
  supplier_info?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const ConsumablesInventory: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);

  const { data: consumables, isLoading, refetch } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []) as unknown as Consumable[];
    }
  });

  const handleEdit = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowEditModal(true);
  };

  const handleReceiveStock = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowReceiveModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowReceiveModal(false);
    setSelectedConsumable(null);
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Consumables Management System"
        subtitle="Advanced consumables tracking, QR integration, and job usage monitoring"
      />
      
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="qr-codes">
            <QrCode className="w-4 h-4 mr-2" />
            QR Codes
          </TabsTrigger>
          <TabsTrigger value="requests">
            <MapPin className="w-4 h-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="job-tracking">
            <Package className="w-4 h-4 mr-2" />
            Job Usage
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="pwa">
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile PWA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Consumable
              </Button>
            </div>
          </div>

          <ConsumablesDashboard 
            consumables={consumables || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onReceiveStock={handleReceiveStock}
            onRefetch={refetch}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ConsumablesReportsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <ConsumableNotificationsPanel />
        </TabsContent>

        <TabsContent value="qr-codes">
          <ConsumableQRGenerator />
        </TabsContent>

        <TabsContent value="requests">
          <ConsumableRequestsManager />
        </TabsContent>

        <TabsContent value="job-tracking">
          <JobConsumablesTracker />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedConsumableAnalytics />
        </TabsContent>

        <TabsContent value="pwa">
          <ConsumablePWAManager />
        </TabsContent>
      </Tabs>

      <AddConsumableModal 
        isOpen={showAddModal}
        onClose={handleModalClose}
      />

      <EditConsumableModal 
        isOpen={showEditModal}
        consumable={selectedConsumable}
        onClose={handleModalClose}
      />

      <ReceiveStockModal 
        isOpen={showReceiveModal}
        consumable={selectedConsumable}
        onClose={handleModalClose}
      />
    </div>
  );
};