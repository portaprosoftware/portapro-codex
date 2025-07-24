import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrdersList } from '@/components/inventory/PurchaseOrdersList';
import { CreatePurchaseOrderModal } from '@/components/inventory/CreatePurchaseOrderModal';
import { PurchaseOrderDetailModal } from '@/components/inventory/PurchaseOrderDetailModal';
import { ReceivePurchaseOrderModal } from '@/components/inventory/ReceivePurchaseOrderModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface PurchaseOrder {
  id: string;
  vendor_name: string;
  order_date: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const PurchaseOrders: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const { data: purchaseOrders, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as PurchaseOrder[];
    }
  });

  const activeOrders = purchaseOrders?.filter(order => order.status === 'pending') || [];
  const completedOrders = purchaseOrders?.filter(order => order.status === 'completed') || [];

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleReceiveOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowReceiveModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setShowReceiveModal(false);
    setSelectedOrder(null);
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage purchase orders and incoming stock"
      />
      
      <div className="flex justify-between items-center">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="all">All Orders ({purchaseOrders?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <PurchaseOrdersList 
            orders={activeOrders}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onReceiveOrder={handleReceiveOrder}
            onRefetch={refetch}
          />
        </TabsContent>

        <TabsContent value="completed">
          <PurchaseOrdersList 
            orders={completedOrders}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onReceiveOrder={handleReceiveOrder}
            onRefetch={refetch}
          />
        </TabsContent>

        <TabsContent value="all">
          <PurchaseOrdersList 
            orders={purchaseOrders || []}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onReceiveOrder={handleReceiveOrder}
            onRefetch={refetch}
          />
        </TabsContent>
      </Tabs>

      <CreatePurchaseOrderModal 
        isOpen={showCreateModal}
        onClose={handleModalClose}
      />

      <PurchaseOrderDetailModal 
        isOpen={showDetailModal}
        order={selectedOrder}
        onClose={handleModalClose}
      />

      <ReceivePurchaseOrderModal 
        isOpen={showReceiveModal}
        order={selectedOrder}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default PurchaseOrders;