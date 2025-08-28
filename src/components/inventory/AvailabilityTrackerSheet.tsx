import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Calendar, Package } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/inventory/AvailabilityCalendar';
import { DateRangeAvailabilityChecker } from '@/components/inventory/DateRangeAvailabilityChecker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGrid } from '@/components/inventory/ProductGrid';

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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[100vh] md:h-[90vh] w-full border-t-4 border-t-blue-500 rounded-t-2xl md:rounded-t-3xl p-0 overflow-hidden"
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
                {/* Product Selection Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-bold">
                        {selectedProductName ? `Selected: ${selectedProductName}` : 'Select a Product to Check Availability'}
                      </span>
                    </div>
                    
                    <div className="w-32">
                      <Input
                        type="number"
                        min="1"
                        value={requestedQuantity}
                        onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
                        placeholder="Quantity"
                        className="w-full font-bold h-10 text-sm"
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground font-medium">
                    Choose a product from the list below to view its availability calendar and date range checker
                  </p>
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
                  <div className="bg-white rounded-lg border">
                    <ProductGrid
                      filter="in_stock"
                      viewType="grid"
                      hideInactive={true}
                      searchQuery=""
                      onProductSelect={(productId) => {
                        setSelectedProductId(productId);
                        // We'll need to fetch the product name separately or modify the callback
                        setSelectedProductName('Selected Product');
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};