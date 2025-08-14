import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Package, BarChart3, MapPin, Calendar, QrCode, Lock, CloudOff, RefreshCcw, Sparkles, BellRing, Shield, Clock } from "lucide-react";

export function InventorySuppliesShowcase() {
  return (
    <section id="inventory" className="py-12 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Inventory & Supplies — Unified, Accurate, Effortless
          </h2>
          <p className="text-lg text-muted-foreground mt-2 max-w-3xl">
            One system for bulk, individual, and hybrid tracking. Plan by date, allocate by location, and scan anything — even embossed plastic — online or offline.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Feature Visuals */}
          <div className="space-y-6">
            {/* Panel A — Unified Stock Modes */}
            <div className="p-[1px] rounded-2xl bg-gradient-blue animate-enter">
              <div className="rounded-2xl bg-white border border-border">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-muted text-foreground">Bulk</span>
                    <span className="px-3 py-1 rounded-full bg-muted/60 text-foreground">Individual</span>
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground">Hybrid</span>
                  </div>

                  <div className="mt-4 grid md:grid-cols-3 gap-4">
                    {/* Bulk mock */}
                    <div className="rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="w-4 h-4 text-primary" /> Bulk Stock
                      </div>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center justify-between"><span>Yard A</span><span className="font-semibold">48</span></li>
                        <li className="flex items-center justify-between"><span>Yard B</span><span className="font-semibold">14</span></li>
                        <li className="flex items-center justify-between"><span>Warehouse</span><span className="font-semibold">20</span></li>
                      </ul>
                      <div className="mt-3 text-xs text-muted-foreground">Low stock alert at Yard B</div>
                    </div>

                    {/* Individual mock */}
                    <div className="rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <QrCode className="w-4 h-4 text-primary" /> Units
                      </div>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center justify-between"><span>PT-1234</span><span className="font-medium text-foreground">Available</span></li>
                        <li className="flex items-center justify-between"><span>PT-1235</span><span className="font-medium text-foreground">Assigned</span></li>
                        <li className="flex items-center justify-between"><span>PT-1236</span><span className="font-medium text-foreground">Service</span></li>
                      </ul>
                      <div className="mt-3 text-xs text-muted-foreground">QR-ready • padlock status visible</div>
                    </div>

                    {/* Hybrid mock */}
                    <div className="rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <RefreshCcw className="w-4 h-4 text-primary" /> Hybrid Roll‑Up
                      </div>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center justify-between"><span>Master Total</span><span className="font-semibold">82</span></li>
                        <li className="flex items-center justify-between"><span>Tracked Units</span><span className="font-semibold">62</span></li>
                        <li className="flex items-center justify-between"><span>Bulk Remainder</span><span className="font-semibold">20</span></li>
                      </ul>
                      <div className="mt-3 text-xs text-muted-foreground">Sync totals keeps everything aligned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel B — Availability & Multi‑location */}
            <div className="p-[1px] rounded-2xl bg-gradient-blue animate-enter">
              <div className="rounded-2xl bg-white border border-border">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" /> Availability by date
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-3">
                      <div className="text-sm font-medium">{`Range: ${new Date().toLocaleDateString()} → +7d`}</div>
                      <div className="mt-2 text-2xl font-bold">45 of 62 available</div>
                      <div className="text-xs text-muted-foreground mt-1">Auto‑holds for scheduled jobs</div>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <div className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Locations</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <span className="px-2 py-1 rounded-full bg-muted">Yard A 28</span>
                        <span className="px-2 py-1 rounded-full bg-muted">Yard B 14</span>
                        <span className="px-2 py-1 rounded-full bg-muted">Warehouse 20</span>
                      </div>
                      <div className="text-xs text-green-700 mt-2">Auto‑allocate to jobs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel C — Track Units with QR Codes */}
            <div className="p-[1px] rounded-2xl bg-gradient-blue animate-enter">
              <div className="rounded-2xl bg-white border border-border">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <QrCode className="w-4 h-4 text-primary" /> Track Units with QR Codes Automatically
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-4 items-center">
                     <div className="flex flex-col items-center space-y-3">
                       <div className="w-3/4">
                         <AspectRatio ratio={1/1}>
                           <img
                             src="/lovable-uploads/a792e7df-6da2-4fc0-826c-d32dcc988d97.png"
                             alt="QR code for Standard Unit 1232"
                             className="w-full h-full object-cover rounded-xl border border-border"
                             loading="lazy"
                             decoding="async"
                           />
                         </AspectRatio>
                       </div>
                       <div className="text-sm font-bold text-foreground">1232 • Standard Unit</div>
                     </div>

                    <div className="rounded-xl border border-border p-3">
                      <div className="text-sm font-medium">QR Label</div>
                       <div className="mt-2 rounded-lg border border-dashed p-3 text-sm">
                         1232 • Standard Unit
                       </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="bg-gradient-blue text-white">Generate</Button>
                        <Button size="sm" variant="outline">Print</Button>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Works offline — syncs later. Instant attach to units & jobs.
                      </div>
                       <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Padlock & zip-ties status
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel D — Photo Scanning */}
            <div className="p-[1px] rounded-2xl bg-gradient-blue animate-enter">
               <div className="rounded-2xl bg-white border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Snap Photo to Track Tool Numbers & Other Data in Embossed Plastic
                </div>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Photo of embossed panel */}
                 <div className="aspect-[4/5]">
                   <img 
                     src="/lovable-uploads/cf4e07bc-0d9b-4a24-a8e7-3db06efc8766.png"
                     alt="Mobile phone camera view of ABC Manufacturing embossed plastic panel"
                     className="w-full h-full object-contain rounded-2xl"
                   />
                 </div>
                
                {/* AI Reading Results */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">AI Reading Results:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="font-medium text-foreground">ABC Manufacturing</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tool No:</span>
                      <span className="font-medium text-foreground">T-207788-1A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor ID:</span>
                      <span className="font-medium text-foreground">32123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mfg Date:</span>
                      <span className="font-medium text-foreground">January 13, 2016</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plastic:</span>
                      <span className="font-medium text-foreground">HDPE</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-gradient-to-r from-green-600 to-green-500 rounded-lg shadow-sm">
                    <div className="text-xs text-white font-bold">✓ Successfully tracked</div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Works offline — syncs later. Instant attach to units & jobs.
                  </div>
                   <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                     <Lock className="w-3 h-3" /> Padlock & zip-ties status
                   </div>
                 </div>
               </div>
               </div>
             </div>
           </div>

          {/* Right: KPIs + Highlights */}
          <aside className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Inventory accuracy" value={99.7} subtitle="Audited monthly" gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" icon={BarChart3} iconBg="hsl(var(--primary))" animateValue />
              <StatCard title="Units tracked" value={1240} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" icon={Package} iconBg="hsl(var(--primary))" animateValue />
              <StatCard title="QR scans / month" value={2340} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" icon={QrCode} iconBg="hsl(var(--primary))" animateValue />
              <StatCard title="Low‑stock alerts / mo" value={18} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" icon={BellRing} iconBg="hsl(var(--primary))" animateValue />
              <StatCard title="Stockouts avoided" value={93} subtitle="percent" gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" icon={Shield} iconBg="hsl(var(--primary))" animateValue />
              <StatCard title="Time saved / week" value={12} subtitle="hours" gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" icon={Clock} iconBg="hsl(var(--primary))" animateValue />
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground">Why teams love it</h3>
              <ul className="mt-3 space-y-2 text-sm text-foreground list-disc list-inside">
                <li>Bulk, individual, and hybrid tracking in one system</li>
                <li>Date‑range availability with per‑location allocation</li>
                <li>QR codes and embossed‑plastic AI reading</li>
                <li>Padlock detection and overdue padlock alerts</li>
                <li>Instant clarity on status — available, assigned, service</li>
                <li>Offline scans attach to units and sync later</li>
              </ul>
            </div>


            <div className="rounded-2xl border border-border p-5">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Offline Scanning & Vision AI — Technical Facts</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>No signal needed:</strong> Scan brand-new QR codes or snap photos of embossed text/serials; everything saves locally.</li>
                <li><strong>Smart PortaPro QRs:</strong> On-device decode reveals the unit ID + a signed token, so the app can recognize and create/link records offline.</li>
                <li><strong>Third-party QRs:</strong> If it's just a web link, we still decode and save it offline; details load once you're online.</li>
                <li><strong>Auto-sync on reconnect:</strong> We verify the signature, run Google Vision OCR on saved photos, upload images, and update records. (Or tap Sync Now anytime.)</li>
                <li><strong>Built as a PWA:</strong> App shell is cached for offline use; scans/photos queue safely in IndexedDB with retry logic.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default InventorySuppliesShowcase;
