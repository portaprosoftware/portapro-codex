import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Droplet, Package, ClipboardList, Calculator, Scan, CheckCircle, DollarSign, Clock } from "lucide-react";
import storageLocationsImg from "@/assets/consumables-storage-locations.png";
import productFormImg from "@/assets/consumables-product-form.png";

export const ConsumablesShowcase: React.FC = () => {
  return (
    <section id="consumables" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Consumables</h2>
          <p className="text-muted-foreground">
            Toilet paper, hand sanitizer, deodorizer—bill them your way and set it up right in the Job Wizard.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left column: Highlights */}
          <div className="pt-4">
            {/* Highlights card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="text-base font-semibold mb-3 text-foreground">Highlights</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Set billing at job creation: Included, Itemized actuals, or Kit fee (+ overage)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Any unit type of measurement: per case, gallon, etc and custom</li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5" /> 
                  <div>
                    "Scan to add" for fast, error-free logging
                    <div className="text-xs text-muted-foreground mt-1">- scan with a mobile device or any <span className="font-bold">physical barcode scanner</span></div>
                  </div>
                </li>
              </ul>
            </div>

            {/* New uploaded image under highlights */}
            <img 
              src="/lovable-uploads/56e55e90-52ea-491a-bbd8-f4b87b1b53b5.png" 
              alt="Add Consumable form interface with name, category, SKU and quantity fields"
              className="w-full h-auto rounded-2xl -mt-8"
            />
          </div>

          {/* Right column: Billing card, Storage image + What customers love */}
          <aside className="space-y-4">
            {/* Consumables Billing card */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <DollarSign className="w-4 h-4 text-primary" /> Consumables Billing — Flexible & Transparent
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="font-medium text-sm text-foreground">Included (bundled):</div>
                  <div className="text-sm text-muted-foreground">Bury the cost in your flat rate for simple pricing.</div>
                </div>
                
                <div className="rounded-lg border border-border p-3">
                  <div className="font-medium text-sm text-foreground">Itemized Actuals:</div>
                  <div className="text-sm text-muted-foreground">Track and charge for every product used—down to the dollar.</div>
                </div>
                
                <div className="rounded-lg border border-border p-3">
                  <div className="font-medium text-sm text-foreground">Kit Fee + Overage:</div>
                  <div className="text-sm text-muted-foreground">Charge a base fee per service kit, with automatic overage billing if usage exceeds your threshold.</div>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Great for blue solution, deodorizers, toilet paper, and cleaning supplies</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Built into your job flow automatically</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Adjust per customer or per job</span>
                </div>
              </div>
            </div>

            <img 
              src="/lovable-uploads/cc2af9ff-9209-4a8b-8eb8-ff99ab053019.png" 
              alt="Inventory management table showing product locations, quantities, and low stock alerts"
              className="w-full h-auto rounded-2xl"
            />
            
            {/* What customers love card moved below image */}
            <div className="rounded-2xl border bg-card p-5 shadow-md">
              <div className="text-base font-semibold mb-3 text-foreground">What customers love</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Automatic overage detection (no missed revenue)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Transparent itemized billing when needed</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Bundled simplicity when you want it</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ConsumablesShowcase;