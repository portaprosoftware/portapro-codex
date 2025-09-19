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

        {/* Main content layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
            {/* Left column: Features list */}
            <div className="space-y-4">
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
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground">
                  💡 Choose simple bundled pricing or detailed itemized billing — PortaPro adapts to your workflow.
                </p>
              </div>
            </div>

            {/* Right column: Main management image and stacked images */}
            <div className="space-y-6">
              {/* Main management interface */}
              <div className="flex justify-center">
                <img
                  src={consumablesManagement}
                  alt="Consumables management interface showing inventory tracking and category management"
                  className="w-full max-w-md h-auto"
                />
              </div>
              
              {/* Two stacked images */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={consumablesInventory}
                    alt="Consumables inventory list showing hand sanitizer refill and paper towel products"
                    className="w-full max-w-sm h-auto"
                  />
                </div>
                <div className="flex justify-center">
                  <img
                    src={consumablesStats}
                    alt="Consumables statistics showing total items, inventory value, and stock alerts"
                    className="w-full max-w-sm h-auto"
                  />
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