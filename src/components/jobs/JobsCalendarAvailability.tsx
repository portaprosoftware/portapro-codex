import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Eye, EyeOff, Package } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/inventory/AvailabilityCalendar';
import { DateRangeAvailabilityChecker } from '@/components/inventory/DateRangeAvailabilityChecker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { ProductSelectionModal } from '@/components/inventory/ProductSelectionModal';

interface JobsCalendarAvailabilityProps {
  selectedDate: Date;
  onDateSelect?: (date: Date) => void;
}

export const JobsCalendarAvailability: React.FC<JobsCalendarAvailabilityProps> = ({
  selectedDate,
  onDateSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const { data: products, isLoading: productsLoading } = useProducts();

  if (!isExpanded) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Availability Tracker
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-7 px-2"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Check product availability across dates for better scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Availability Tracker
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-7 px-2"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Product Selection */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold">Product Selection</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Button
                variant="outline"
                onClick={() => setShowProductModal(true)}
                className="w-full justify-start text-left h-10 font-bold"
                disabled={productsLoading}
              >
                {selectedProductName || (productsLoading ? "Loading products..." : "Select a product to check availability")}
              </Button>
            </div>
            
            <div>
              <Input
                type="number"
                min="1"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
                placeholder="Quantity"
                className="w-full font-bold"
              />
            </div>
          </div>
        </div>

        {selectedProductId ? (
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="font-bold">Calendar View</TabsTrigger>
              <TabsTrigger value="range" className="font-bold">Date Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-4">
              <AvailabilityCalendar
                productId={selectedProductId}
                productName={selectedProductName || 'Selected Product'}
                requestedQuantity={requestedQuantity}
                onDateSelect={onDateSelect}
                className="max-h-80 overflow-y-auto"
              />
            </TabsContent>
            
            <TabsContent value="range" className="mt-4">
              <DateRangeAvailabilityChecker
                productId={selectedProductId}
                productName={selectedProductName || 'Selected Product'}
                requestedQuantity={requestedQuantity}
                className="max-h-80 overflow-y-auto"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-bold mb-2">Select a Product</p>
            <p className="text-sm font-bold">Choose a product above to view its availability calendar and date range checker</p>
          </div>
        )}
        
        {/* Product Selection Modal */}
        <ProductSelectionModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          onProductSelect={(productId, productName) => {
            setSelectedProductId(productId);
            setSelectedProductName(productName);
          }}
          selectedProductId={selectedProductId}
        />
      </CardContent>
    </Card>
  );
};