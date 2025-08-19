import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export const InventoryLogicPopup: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          Bulk vs Tracked Unit Inventory
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📌 Inventory Logic Explained</DialogTitle>
          <DialogDescription>
            Understanding how bulk and tracked unit inventory works together
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">1. Adding Tracked Units:</h4>
            <p className="text-blue-800">
              If you already have 50 total units and you add 10 tracked units, the total stays at 50. 
              You're just converting 10 of the existing units to be individually tracked. 
              <span className="font-semibold"> ➡️ Now you have 10 tracked and 40 bulk units.</span>
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">2. Adding to Bulk Inventory:</h4>
            <p className="text-green-800">
              When you add units to bulk inventory, you are increasing the total unit count. 
              For example, adding 10 bulk units to your existing 50 gives you 60 total units. 
              <span className="font-semibold"> ➡️ You'll then have the option to mark any or all of those new units as tracked if needed.</span>
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">✅ Multi-Site Simplicity:</h4>
            <p className="text-purple-800">
              Units stored at different site locations are all included in your total bulk count—automatically. 
              There's no extra work. Site location doesn't change the logic—everything is tracked cleanly and seamlessly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};