import React from "react";
import { CheckCircle } from "lucide-react";
import consumablesManagement from "@/assets/consumables-management.png";
import consumablesInventory from "@/assets/consumables-inventory.png";
import consumablesStats from "@/assets/consumables-stats.png";

export const ConsumablesShowcase: React.FC = () => {
  return (
    <section id="consumables" className="py-6 md:py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <header className="mb-4 md:mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">🧻 Consumables — Flexible & Transparent</h2>
        </header>

        {/* Content with mockup */}
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Left column - Description and Features list */}
            <div className="space-y-4 md:space-y-6">
              <p className="text-muted-foreground">
                Bill for toilet paper, hand sanitizer, deodorizer, and more — your way.
              </p>
              
              <ul className="space-y-3 md:space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Flexible billing at job creation: bundled, itemized, or kit + overage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Track any unit type with fast barcode or mobile scan logging</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Automatic overage detection + transparent reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Works for blue solution, deodorizers, cleaning supplies & more</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Built into your job flow, adjustable per customer or job</span>
                </li>
              </ul>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground">
                  💡 Choose bundled simplicity or detailed itemized billing — PortaPro adapts to your workflow.
                </p>
              </div>
            </div>

            {/* Right column - Consumables mockup */}
            <div className="bg-card rounded-lg shadow-md border overflow-hidden">
              <div className="bg-primary/5 px-4 py-3 border-b">
                <h3 className="text-base font-semibold text-foreground">Consumables Inventory</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Toilet Paper (Cases)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">48 in stock</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Hand Sanitizer (Gallons)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">12 in stock</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Blue Solution (Gallons)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3 in stock</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Deodorizer (Bottles)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">24 in stock</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Billing Mode: Job #1234</span>
                    <span className="text-primary font-medium">Kit + Overage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsumablesShowcase;