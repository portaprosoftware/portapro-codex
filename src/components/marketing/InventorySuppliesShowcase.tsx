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
                    <AspectRatio ratio={4/3}>
                      <img
                        src="/lovable-uploads/f550f01a-a436-4f0b-bb81-d3f51b8fe0c0.png"
                        alt="Embossed plastic AI scan preview for molded panel"
                        className="w-full h-full object-cover rounded-xl border border-border"
                        loading="lazy"
                        decoding="async"
                      />
                    </AspectRatio>

                    <div className="rounded-xl border border-border p-3">
                      <div className="text-sm font-medium">QR Label</div>
                      <div className="mt-2 rounded-lg border border-dashed p-3 text-sm">
                        PT‑1234 • Satellite
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="bg-gradient-blue text-white">Generate</Button>
                        <Button size="sm" variant="outline">Print</Button>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Works offline — syncs later. Instant attach to units & jobs.
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Padlock detection & overdue alerts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel D — Photo Scanning */}
            <div className="rounded-2xl border border-border p-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4 text-primary" /> Snap Photo to Track Tool Number in Embossed Plastic
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Photo of embossed panel */}
                <AspectRatio ratio={4/5}>
                  <img 
                    src="/lovable-uploads/47061b38-ad88-4a95-9d7b-0db78537d483.png"
                    alt="Embossed plastic panel with unit information"
                    className="w-full h-full object-cover rounded-xl border"
                  />
                </AspectRatio>
                
                {/* AI Reading Results */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">AI Reading Results:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit No:</span>
                      <span className="font-medium text-foreground">PT-1234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="font-medium text-foreground">ABC Manufacturing</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial No:</span>
                      <span className="font-medium text-foreground">7A-221</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mfg Date:</span>
                      <span className="font-medium text-foreground">2025-02</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs text-green-700 font-medium">✓ Successfully tracked</div>
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
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li>Bulk, individual, and hybrid tracking in one system</li>
                <li>Date‑range availability with per‑location allocation</li>
                <li>QR codes and embossed‑plastic AI reading</li>
                <li>Padlock detection and overdue padlock alerts</li>
                <li>Auto‑sync totals, real‑time updates across products</li>
                <li>Offline scans attach to units and sync later</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">What customers love</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Reorder suggestions that actually match lead times</li>
                <li>Instant clarity on status — available, assigned, service</li>
                <li>Printable labels that survive worksite conditions</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button className="bg-gradient-blue text-white">Explore Inventory</Button>
              <Button variant="outline">See a live demo</Button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default InventorySuppliesShowcase;
