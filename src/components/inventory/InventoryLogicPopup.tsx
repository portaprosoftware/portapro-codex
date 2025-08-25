import React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Info, X, ArrowRightLeft, Plus, AlertCircle } from "lucide-react";

export const InventoryLogicPopup: React.FC = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground">
          <Info className="h-3 w-3 mr-1" />
          Bulk vs Tracked Unit Examples
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] w-full">
        <DrawerHeader className="relative">
          <DrawerTitle>Understanding Operations</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 p-2">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto">
          <div className="space-y-6 text-sm">
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-foreground">1. Convert Bulk Pool to Tracked Items</h4>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-1">
                    <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
                  </p>
                  <p className="text-muted-foreground mb-3">
                    You convert 10 bulk units into tracked units.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>After:</strong> Bulk = 40, Tracked = 10 → Total = 50
                  </p>
                </div>
                <div className="flex-1">
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Bulk decreases by 10 (50 → 40)</li>
                    <li>• Tracked increases by 10 (0 → 10)</li>
                    <li>• Total unchanged (50 → 50)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-foreground">2. Add New Tracked Inventory</h4>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-1">
                    <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
                  </p>
                  <p className="text-muted-foreground mb-3">
                    You add 5 new tracked units with serial numbers.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>After:</strong> Bulk = 50, Tracked = 5 → Total = 55
                  </p>
                </div>
                <div className="flex-1">
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Bulk unchanged (50 → 50)</li>
                    <li>• Tracked increases by 5 (0 → 5)</li>
                    <li>• Total increases by 5 (50 → 55)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold text-foreground">3. Add Bulk Inventory</h4>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-1">
                    <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
                  </p>
                  <p className="text-muted-foreground mb-3">
                    You add 10 new bulk units.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>After:</strong> Bulk = 60, Tracked = 0 → Total = 60
                  </p>
                </div>
                <div className="flex-1">
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Bulk increases by 10 (50 → 60)</li>
                    <li>• Tracked unchanged (0 → 0)</li>
                    <li>• Total increases by 10 (50 → 60)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-foreground">4. Remove Bulk Inventory</h4>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-1">
                    <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
                  </p>
                  <p className="text-muted-foreground mb-3">
                    You remove 5 bulk units from inventory.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>After:</strong> Bulk = 45, Tracked = 0 → Total = 45
                  </p>
                </div>
                <div className="flex-1">
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Bulk decreases by 5 (50 → 45)</li>
                    <li>• Tracked unchanged (0 → 0)</li>
                    <li>• Total decreases by 5 (50 → 45)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};