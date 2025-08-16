import React, { useState, useEffect } from "react";
import { QrCode, Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackingSlide {
  id: string;
  title: string;
  icon: React.ComponentType<any> | string;
  content: React.ReactNode;
}

const TrackingSlider = ({ currentSlide, slides }: { currentSlide: number; slides: TrackingSlide[] }) => {
  const slide = slides[currentSlide];
  
  return (
    <div className="rounded-2xl bg-white border border-border p-4 transition-all duration-500 animate-fade-in min-h-[400px]">
      <div className="flex items-center gap-2 text-sm font-medium mb-4">
        {typeof slide.icon === 'string' ? (
          <img src={slide.icon} alt="" className="w-4 h-4" />
        ) : (
          <slide.icon className="w-4 h-4 text-primary" />
        )} 
        {slide.title}
      </div>
      {slide.content}
    </div>
  );
};

export function TrackingMethodsSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const slides: TrackingSlide[] = [
    {
      id: "qr-codes",
      title: "Track Units with QR Codes Automatically",
      icon: QrCode,
      content: (
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          <div className="flex justify-center">
            <div className="w-48">
              <div className="aspect-square">
                <img
                  src="/lovable-uploads/bb5d9cd1-f40b-41b3-87e2-5d83dfa7d3a8.png"
                  alt="QR code for Standard Unit 1232"
                  className="w-full h-full object-cover rounded-lg border border-border"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="text-xs font-bold text-foreground text-center mt-2">1232 • Standard Unit</div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="text-xs font-medium">QR Label</div>
            <div className="mt-2 rounded-md border border-dashed p-2 text-xs">
              1232 • Standard Unit
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-2 py-1">Generate</Button>
              <Button size="sm" variant="outline" className="text-xs px-2 py-1">Print</Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Works offline — syncs later. Instant attach to units & jobs.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "embossed-plastic",
      title: "Snap & Track Units from Embossed Plastic Tool Numbers",
      icon: "/lovable-uploads/3af96989-f6b4-4649-9808-1c980acda0b7.png",
      content: (
        <div className="grid sm:grid-cols-2 gap-6 items-start">
          <div className="flex justify-center">
            <div className="w-full">
              <div className="aspect-[3/4]">
                <img
                  src="/lovable-uploads/da7aff95-16a3-491e-bb6b-80f87067ff7c.png"
                  alt="Mobile phone scanning embossed plastic tool number with AI reading results"
                  className="w-full h-full object-cover rounded-lg border border-border"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-medium">ABC Manufacturing</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tool No:</span>
                <span className="font-medium">T-207788-1A</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor ID:</span>
                <span className="font-medium">32123</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mfg Date:</span>
                <span className="font-medium">January 13, 2016</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plastic:</span>
                <span className="font-medium">HDPE</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white p-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-bold">Successfully tracked</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Works offline — syncs later. Instant attach to units & jobs.
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, 5000);

    // Progress timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / 50); // 5000ms / 100ms = 50 steps
      });
    }, 100);

    return () => {
      clearInterval(slideInterval);
      clearInterval(progressInterval);
    };
  }, [slides.length]);

  return (
    <div className="aspect-video flex flex-col items-center justify-center">
      <TrackingSlider currentSlide={currentSlide} slides={slides} />
      
      {/* Progress Timer */}
      <div className="mt-4 w-full max-w-md">
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-100" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}