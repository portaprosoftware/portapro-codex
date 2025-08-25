import React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Info } from "lucide-react";

export const InventoryLogicPopup: React.FC = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          Bulk vs Tracked Unit Inventory
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] w-full md:max-w-[75vw] md:mx-auto">
        <DrawerHeader>
          <DrawerTitle>Understanding Operations</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto">
          <div className="space-y-6 text-sm">
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-3">1. Convert</h4>
              <p className="text-muted-foreground mb-1">
                <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
              </p>
              <p className="text-muted-foreground mb-3">
                You convert 10 bulk units into tracked units.
              </p>
              <p className="text-muted-foreground mb-3">
                <strong>After:</strong> Bulk = 40, Tracked = 10 → Total = 50
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Bulk decreases by 10 (50 → 40)</li>
                <li>• Tracked increases by 10 (0 → 10)</li>
                <li>• Total unchanged (50 → 50)</li>
              </ul>
            </div>
            
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-3">2. Add Tracked</h4>
              <p className="text-muted-foreground mb-1">
                <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
              </p>
              <p className="text-muted-foreground mb-3">
                You add 5 new tracked units with serial numbers.
              </p>
              <p className="text-muted-foreground mb-3">
                <strong>After:</strong> Bulk = 50, Tracked = 5 → Total = 55
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Bulk unchanged (50 → 50)</li>
                <li>• Tracked increases by 5 (0 → 5)</li>
                <li>• Total increases by 5 (50 → 55)</li>
              </ul>
            </div>
            
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-3">3. Add Bulk</h4>
              <p className="text-muted-foreground mb-1">
                <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
              </p>
              <p className="text-muted-foreground mb-3">
                You add 10 new bulk units.
              </p>
              <p className="text-muted-foreground mb-3">
                <strong>After:</strong> Bulk = 60, Tracked = 0 → Total = 60
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Bulk increases by 10 (50 → 60)</li>
                <li>• Tracked unchanged (0 → 0)</li>
                <li>• Total increases by 10 (50 → 60)</li>
              </ul>
            </div>
            
            <div className="bg-muted/50 p-5 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-3">4. Remove Bulk</h4>
              <p className="text-muted-foreground mb-1">
                <strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50
              </p>
              <p className="text-muted-foreground mb-3">
                You remove 5 bulk units from inventory.
              </p>
              <p className="text-muted-foreground mb-3">
                <strong>After:</strong> Bulk = 45, Tracked = 0 → Total = 45
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Bulk decreases by 5 (50 → 45)</li>
                <li>• Tracked unchanged (0 → 0)</li>
                <li>• Total decreases by 5 (50 → 45)</li>
              </ul>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};