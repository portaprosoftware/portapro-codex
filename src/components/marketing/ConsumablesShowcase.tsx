import React from "react";
import { CheckCircle } from "lucide-react";
import consumablesManagement from "@/assets/consumables-management.png";
import consumablesInventory from "@/assets/consumables-inventory.png";
import consumablesStats from "@/assets/consumables-stats.png";

export const ConsumablesShowcase: React.FC = () => {
  return (
    <section id="consumables" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">🧻 Consumables — Flexible & Transparent</h2>
          <p className="text-muted-foreground">
            Bill for toilet paper, hand sanitizer, deodorizer, and more — your way.
          </p>
        </header>

        {/* Content with mockup */}
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Features list */}
            <div className="space-y-4">
              <ul className="space-y-4">
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
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground">
                  💡 Choose bundled simplicity or detailed itemized billing — PortaPro adapts to your workflow.
                </p>
              </div>
            </div>

            {/* Consumables mockup */}
            <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-foreground">Consumables Inventory</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Toilet Paper (Cases)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">48 in stock</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Hand Sanitizer (Gallons)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">12 in stock</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Blue Solution (Gallons)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">3 in stock</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Deodorizer (Bottles)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">24 in stock</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
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