import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Package } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/inventory/AvailabilityCalendar';
import { DateRangeAvailabilityChecker } from '@/components/inventory/DateRangeAvailabilityChecker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { ProductSelectionModal } from '@/components/inventory/ProductSelectionModal';

interface AvailabilityTrackerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export const AvailabilityTrackerSheet: React.FC<AvailabilityTrackerSheetProps> = ({
  open,
  onOpenChange,
  selectedDate,
  onDateSelect
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const { data: products, isLoading: productsLoading } = useProducts();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[100vh] md:h-[75vh] w-full border-t-4 border-t-blue-500 rounded-t-2xl md:rounded-t-3xl p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                <Calendar className="h-6 w-6 text-blue-600" />
                Availability Tracker
              </SheetTitle>
              <SheetDescription className="font-medium">
                Check product availability across dates for better scheduling
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Product Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-bold">Product Selection</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowProductModal(true)}
                        className="w-full justify-start text-left h-12 font-bold text-base"
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
                        className="w-full font-bold h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                {selectedProductId ? (
                  <Tabs defaultValue="calendar" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                      <TabsTrigger value="calendar" className="font-bold text-base">Calendar View</TabsTrigger>
                      <TabsTrigger value="range" className="font-bold text-base">Date Range</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="calendar" className="mt-6">
                      <AvailabilityCalendar
                        productId={selectedProductId}
                        productName={selectedProductName || 'Selected Product'}
                        requestedQuantity={requestedQuantity}
                        onDateSelect={onDateSelect}
                      />
                    </TabsContent>
                    
                    <TabsContent value="range" className="mt-6">
                      <DateRangeAvailabilityChecker
                        productId={selectedProductId}
                        productName={selectedProductName || 'Selected Product'}
                        requestedQuantity={requestedQuantity}
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-bold mb-2">Select a Product</p>
                    <p className="text-base font-bold">Choose a product above to view its availability calendar and date range checker</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
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
    </>
  );
};