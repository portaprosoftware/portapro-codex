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

        {/* Compact layout without image */}
        <div className="max-w-7xl mx-auto">
          <div className="max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Set billing at job creation: Included, Itemized, or Kit Fee + Overage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Track any unit type: case, gallon, or custom</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Fast, error-free logging with barcode or mobile scan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Automatic overage detection (no missed revenue)</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Transparent itemized billing or bundled simplicity</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Works for blue solution, deodorizers, cleaning supplies & more</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Built into your job flow, adjustable per customer or per job</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 p-4 bg-muted rounded-lg max-w-3xl">
              <p className="text-sm text-foreground">
                💡 Choose simple bundled pricing or detailed itemized billing — PortaPro adapts to your workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsumablesShowcase;