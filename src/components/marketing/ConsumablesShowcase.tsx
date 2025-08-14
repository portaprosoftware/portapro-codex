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
          {/* Left column: Job Wizard setup + Highlights */}
          <div className="space-y-6">
            {/* Panel A — Job Wizard setup */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Job Wizard — Consumables Billing</h3>
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Segmented control mock */}
              <div className="inline-flex rounded-xl border bg-background p-1 text-sm mb-4">
                <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold shadow-md">Included (bundled)</button>
                <button className="px-3 py-1 rounded-lg text-foreground">Itemized actuals</button>
                <button className="px-3 py-1 rounded-lg text-foreground">Kit fee (+ overage)</button>
              </div>

            </article>

            {/* Highlights card */}
            <div className="rounded-2xl border bg-card p-5 shadow-md">
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
              className="w-full h-auto rounded-2xl"
            />
          </div>

          {/* Right column: What customers love + Storage image */}
          <aside className="space-y-6">
            {/* What customers love card moved here */}
            <div className="rounded-2xl border bg-card p-5 shadow-md">
              <div className="text-base font-semibold mb-3 text-foreground">What customers love</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Automatic overage detection (no missed revenue)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Transparent itemized billing when needed</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Bundled simplicity when you want it</li>
              </ul>
            </div>
            
            <img 
              src="/lovable-uploads/bedc2be5-1c1d-4884-a05f-2859d68abd99.png" 
              alt="Storage locations interface showing inventory levels across multiple locations"
              className="w-full h-auto rounded-2xl"
            />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ConsumablesShowcase;