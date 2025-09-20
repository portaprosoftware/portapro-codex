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
          {/* Left: Feature Sections */}
          <div className="space-y-8">
            {/* General Inventory Management */}
            <div className="rounded-2xl bg-white border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">General Inventory Management</h3>
              <p className="text-muted-foreground mb-6">
                Comprehensive inventory control with bulk, individual, and hybrid tracking capabilities.
              </p>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Unified Stock Modes</div>
                    <div className="text-sm text-muted-foreground">Track bulk quantities, individual units, or combine both methods seamlessly</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Date-Range Availability</div>
                    <div className="text-sm text-muted-foreground">Plan inventory allocation by date with automated holds for scheduled jobs</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Real-Time Analytics</div>
                    <div className="text-sm text-muted-foreground">Live dashboard with availability counts and allocation insights</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Tracking */}
            <div className="rounded-2xl bg-white border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Stock Tracking</h3>
              <p className="text-muted-foreground mb-6">
                Advanced tracking methods that work online and offline with instant synchronization.
              </p>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">QR Code Generation & Scanning</div>
                    <div className="text-sm text-muted-foreground">Generate, print, and scan QR codes for instant unit identification</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">AI Photo Recognition</div>
                    <div className="text-sm text-muted-foreground">Snap photos of embossed plastic numbers for automatic unit tracking</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CloudOff className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Offline Capabilities</div>
                    <div className="text-sm text-muted-foreground">Continue scanning without internet - everything syncs when reconnected</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Management */}
            <div className="rounded-2xl bg-white border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Location Management</h3>
              <p className="text-muted-foreground mb-6">
                Multi-location inventory tracking with automated allocation and transfer management.
              </p>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Multi-Yard Tracking</div>
                    <div className="text-sm text-muted-foreground">Track inventory across multiple yards, warehouses, and field locations</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCcw className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Auto-Allocation</div>
                    <div className="text-sm text-muted-foreground">Automatically assign inventory to jobs based on location and availability</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Transfer Tracking</div>
                    <div className="text-sm text-muted-foreground">Monitor unit movements between locations with timestamp history</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Screenshots and Summary */}
          <aside className="space-y-6">
            {/* QR & Photo Scanning Demo */}
            <div className="rounded-2xl border border-border overflow-hidden">
              <img 
                src="/assets/qr-photo-scanning-demo.png"
                alt="QR & Photo Scanning demonstration showing mobile scanning and embedded plastic text recognition"
                className="w-full h-auto"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Unit Maintenance Demo */}
            <div className="rounded-2xl border border-border overflow-hidden">
              <img 
                src="/assets/unit-maintenance-demo.png"
                alt="Unit Maintenance & History interface showing comprehensive maintenance tracking"
                className="w-full h-auto"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Interactive Demo */}
            <div>
              <InventoryManagementShowcase />
            </div>

            {/* Image Slideshow */}
            <div className="rounded-2xl border border-border p-4">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                {slides[currentSlide].title}
              </div>
              <InventorySlider currentSlide={currentSlide} slides={slides} />
              <div className="text-xs text-muted-foreground mt-2">
                {slides[currentSlide].content}
              </div>
              
              {/* Slide indicators */}
              <div className="flex justify-center gap-2 mt-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-primary' : 'bg-muted'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Summary: Why Teams Love It */}
            <div className="rounded-2xl border border-border p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">🚀</div>
                <h3 className="text-lg font-semibold text-foreground">Why Teams Love PortaPro Product Inventory</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Bulk, individual, and hybrid tracking in one system</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Date-range availability by location</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">QR codes & embossed-plastic AI reading</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Maintenance work orders with technician & cost tracking</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Service history & automated scheduling</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Padlock & zip-tie drop-off notations</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Clear status at a glance — available, assigned, service</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-foreground font-medium">Works offline: scan QR codes or unit serials, everything saves and syncs automatically once reconnected</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default InventorySuppliesShowcase;