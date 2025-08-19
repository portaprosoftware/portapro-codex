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
          <DialogTitle>How Inventory Works in PortaPro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">1. Converting Bulk to Tracked</h4>
            <p className="text-muted-foreground mb-2">
              If you already have <strong>50 bulk units</strong> and convert 10 of them to tracked, the total fleet doesn't change.
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">➡️ You'll now see <strong>10 tracked + 40 bulk = 50 total units.</strong></span>
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">2. Adding Bulk Inventory</h4>
            <p className="text-muted-foreground mb-2">
              When you add new bulk units, you increase the fleet size.
            </p>
            <p className="text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">➡️ For example, adding <strong>10 new bulk units</strong> to your existing 50 gives you <strong>60 total units.</strong></span>
            </p>
            <p className="text-muted-foreground">
              Any of these can later be tracked individually if needed.
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">3. Starting With Tracked Units</h4>
            <p className="text-muted-foreground mb-3">
              You don't have to start with bulk — you can begin with tracked units, or even mix both.
            </p>
            
            <div className="mb-3">
              <p className="text-muted-foreground font-semibold mb-1">Example A (Converting):</p>
              <p className="text-muted-foreground mb-1">
                Start with <strong>10 bulk units</strong>. If you later decide to track all of them, you'll see <strong>10 bulk + 10 tracked = 10 total units.</strong>
              </p>
              <p className="text-muted-foreground">
                Nothing was added — you're just creating tracked records for the same 10 that already existed.
              </p>
            </div>
            
            <div>
              <p className="text-muted-foreground font-semibold mb-1">Example B (Extending):</p>
              <p className="text-muted-foreground mb-1">
                After that, if you add <strong>5 new units directly as tracked</strong>, they stack on top of your original fleet.
              </p>
              <p className="text-muted-foreground mb-1">
                Now you'll see <strong>15 tracked + 10 bulk = 15 total units.</strong>
              </p>
              <p className="text-muted-foreground">
                The total reflects your real fleet size, whether units came in bulk or tracked directly.
              </p>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Why it works this way</h4>
            <p className="text-muted-foreground">
              Your fleet total <strong>always matches reality.</strong> Whether you begin bulk-first, tracked-first, or a mix, PortaPro adapts to your workflow so you can manage your inventory in the way that makes the most sense for your business.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};