import React from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Locate, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate?: () => void;
  onRecenter: () => void;
  className?: string;
}

export const MobileMapControls: React.FC<MobileMapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onLocate,
  onRecenter,
  className,
}) => {
  return (
    <div className={cn("absolute bottom-4 right-4 z-10 flex flex-col gap-2", className)}>
      {/* Zoom Controls */}
      <Button
        onClick={onZoomIn}
        size="icon"
        className="h-11 w-11 rounded-full bg-white hover:bg-gray-100 text-gray-900 shadow-md"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-5 w-5" />
      </Button>
      
      <Button
        onClick={onZoomOut}
        size="icon"
        className="h-11 w-11 rounded-full bg-white hover:bg-gray-100 text-gray-900 shadow-md"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-5 w-5" />
      </Button>

      {/* Locate Me Button */}
      {onLocate && (
        <Button
          onClick={onLocate}
          size="icon"
          className="h-11 w-11 rounded-full bg-white hover:bg-gray-100 text-gray-900 shadow-md"
          aria-label="Locate me"
        >
          <Locate className="h-5 w-5" />
        </Button>
      )}

      {/* Re-center Button */}
      <Button
        onClick={onRecenter}
        size="icon"
        className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        aria-label="Re-center map"
      >
        <Maximize2 className="h-5 w-5" />
      </Button>
    </div>
  );
};
