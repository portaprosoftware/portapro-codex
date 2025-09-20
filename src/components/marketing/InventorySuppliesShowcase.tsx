import React, { useState, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Package, BarChart3, MapPin, Calendar, QrCode, Lock, CloudOff, RefreshCcw, Sparkles, BellRing, Shield, Clock, Wrench, AlertTriangle, User, DollarSign } from "lucide-react";
import { InventoryManagementShowcase } from "./InventoryManagementShowcase";

const InventorySlider = ({ currentSlide, slides }: { currentSlide: number; slides: any[] }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displaySlide, setDisplaySlide] = useState(currentSlide);

  useEffect(() => {
    if (displaySlide !== currentSlide) {
      setIsTransitioning(true);
      
      // Start fade out and scale out
      setTimeout(() => {
        setDisplaySlide(currentSlide);
        setIsTransitioning(false);
      }, 200); // Half the transition duration
    }
  }, [currentSlide, displaySlide]);

  return (
    <div className="relative w-full">
      <img
        src={slides[displaySlide].image}
        alt={slides[displaySlide].title}
        className={`w-full h-auto rounded-lg transition-all duration-400 ease-out ${
          isTransitioning 
            ? 'animate-exit opacity-0 scale-95' 
            : 'animate-enter opacity-100 scale-100'
        }`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export function InventorySuppliesShowcase() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Multi-Location Management",
      content: "Track inventory across multiple yards and locations with real-time status updates.",
      image: "/lovable-uploads/68283100-ac4d-4613-bfbf-a9a418dcaab5.png"
    },
    {
      title: "Hybrid Tracking System", 
      content: "Combine bulk and individual tracking for complete inventory visibility and control.",
      image: "/lovable-uploads/93533cb9-5e26-4b8e-9dc6-1539b5beba20.png"
    },
    {
      title: "Real-Time Availability",
      content: "Instant visibility into available units with automated allocation and status tracking.",
      image: "/lovable-uploads/1048c86e-2700-4c73-9c4f-1b5c7442323c.png"
    },
    {
      title: "Product Variations",
      content: "Create and manage product variations like colors and features for individual inventory items.",
      image: "/lovable-uploads/57dd64d3-c193-410c-8253-e191cb2682e4.png"
    },
    {
      title: "Maintenance Updates",
      content: "Track maintenance work with technician details, labor hours, parts costs, and progress updates.",
      image: "/lovable-uploads/423b165e-d86d-47b2-8ee6-c6fc94159817.png"
    },
    {
      title: "Unit Management",
      content: "Manage individual units with maintenance details, location tracking, and service scheduling.",
      image: "/lovable-uploads/f63d0c20-6dec-4f93-a5ff-04f120b1d177.png"
    }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => {
      clearInterval(slideInterval);
    };
  }, [slides.length]);
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
            <div className="rounded-2xl bg-white border border-border animate-enter">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="w-4 h-4 text-primary" /> Inventory Tracked How You Use It
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
                    </div>
                  </div>
                </div>
            </div>

            {/* Panel B — Availability & Multi‑location */}
            <div className="rounded-2xl bg-white border border-border animate-enter">
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

            {/* Panel C — Unit Maintenance & History */}
            <div className="rounded-2xl bg-white border border-border animate-enter">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-base mb-1">Unit Maintenance & History</h3>
                      <p className="text-sm text-muted-foreground mb-4">Maintenance Work Orders & Service History</p>
                      
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-foreground leading-relaxed">Mobile maintenance work order management with real-time updates and photo documentation</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-foreground leading-relaxed">Complete service history tracking for condition monitoring and compliance reporting</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-foreground leading-relaxed">Automated preventive maintenance scheduling with technician assignments and parts tracking</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Panel D — Track Units with QR Codes */}
            <div className="rounded-2xl bg-white border border-border animate-enter">
                <div className="p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <QrCode className="w-4 h-4 text-primary" /> Track Units with QR Codes Automatically
                  </div>

                  <div className="mt-3 grid sm:grid-cols-2 gap-3 items-center">
                     <div className="flex flex-col items-center space-y-2">
                       <div className="w-2/3">
                         <AspectRatio ratio={1/1}>
                            <img
                              src="/lovable-uploads/1410c8e3-cd74-47ef-892c-0d261cfceff6.png"
                              alt="QR code for Standard Unit 1232"
                             className="w-full h-full object-cover rounded-lg border border-border"
                             loading="lazy"
                             decoding="async"
                           />
                         </AspectRatio>
                       </div>
                       <div className="text-xs font-bold text-foreground">1232 • Standard Unit</div>
                     </div>

                    <div className="rounded-lg border border-border p-2">
                      <div className="text-xs font-medium">QR Label</div>
                       <div className="mt-2 rounded-md border border-dashed p-2 text-xs">
                         1232 • Standard Unit
                       </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="bg-gradient-blue text-white text-xs px-2 py-1">Generate</Button>
                        <Button size="sm" variant="outline" className="text-xs px-2 py-1">Print</Button>
                      </div>
                       <div className="mt-2 text-xs text-muted-foreground">
                         Works offline — syncs later. Instant attach to units & jobs.
                       </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Panel E — Photo Scanning */}
            <div className="rounded-2xl bg-white border border-border p-4 animate-enter">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Snap & Track Units from Embossed Plastic Tool Numbers
                </div>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Photo of embossed panel */}
                 <div className="flex justify-center">
                   <img 
                     src="/lovable-uploads/cf4e07bc-0d9b-4a24-a8e7-3db06efc8766.png"
                     alt="Mobile phone camera view of ABC Manufacturing embossed plastic panel"
                     className="max-w-full h-auto rounded-2xl"
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
                </div>
            </div>

           </div>

           </div>

          {/* Right: Interactive Demo & Benefits */}
          <aside className="space-y-6 animate-fade-in">
            {/* Interactive Demo */}
            <div>
              <InventoryManagementShowcase />
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground">Why teams love it</h3>
              <ul className="mt-3 space-y-2 text-sm text-foreground list-disc list-inside">
                <li>Bulk, individual, and hybrid tracking in one system</li>
                <li>Date‑range availability with per‑location allocation</li>
                <li>QR codes and embossed‑plastic AI reading</li>
                <li>Maintenance work orders with technician & cost tracking</li>
                <li>Service history and automated scheduling</li>
                <li>Padlock and zip-tie drop-off notations</li>
                <li>Instant clarity on status — available, assigned, service</li>
                <li>Offline scans attach to units and sync later</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border p-5 mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Offline Scanning Made Easy</h4>
              <div className="space-y-3 text-sm">
                <p><strong>No signal? No problem.</strong><br />
                You can scan new QR codes or take photos of unit serials—everything saves safely to your device.</p>
                
                <p>If it's a PortaPro QR, the app instantly knows the unit and links it, even offline.</p>
                
                <p>For third-party QR codes, the scan is still saved and updates once you're back online.</p>
                
                <p>When you're reconnected, everything syncs automatically—photos, scans, and records. You can also tap Sync Now anytime.</p>
                
                <p>The PWA (add to home screen) app is built to work offline and won't lose your data</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default InventorySuppliesShowcase;
