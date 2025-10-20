import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MapPin, Wrench, MoreHorizontal, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkerDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: any;
  onView?: () => void;
  onAssign?: () => void;
  onService?: () => void;
  onNavigate?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  assigned: {
    label: "Assigned",
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold",
  },
  delivered: {
    label: "Deployed",
    className: "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold",
  },
  in_service: {
    label: "Service",
    className: "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold",
  },
  available: {
    label: "Idle",
    className: "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold",
  },
};

export const MarkerDetailsSheet: React.FC<MarkerDetailsSheetProps> = ({
  open,
  onOpenChange,
  location,
  onView,
  onAssign,
  onService,
  onNavigate,
}) => {
  if (!location) return null;

  const statusInfo = statusConfig[location.status] || statusConfig.available;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      // Open native maps app
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
      window.open(url, "_blank");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg line-clamp-2 mb-2">
                {location.customer_name || "Unknown Location"}
              </SheetTitle>
              <Badge className={cn("text-xs px-2 py-0.5", statusInfo.className)}>
                {statusInfo.label}
              </Badge>
            </div>
            {location.product_image && (
              <img
                src={location.product_image}
                alt="Product"
                className="w-16 h-16 rounded-lg object-cover border"
              />
            )}
          </div>
          <SheetDescription className="text-sm space-y-2 mt-3">
            {/* Address */}
            {location.customer_address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1">{location.customer_address}</span>
              </div>
            )}
            
            {/* Quantity */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Units at Location:</span>
              <span className="text-lg font-bold">{location.quantity}</span>
            </div>

            {/* Last Updated */}
            {location.last_updated && (
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(location.last_updated).toLocaleDateString()}
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-6">
          {onView && (
            <Button
              variant="outline"
              onClick={() => {
                onView();
                onOpenChange(false);
              }}
              className="h-12"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleNavigate}
            className="h-12"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Navigate
          </Button>

          {onAssign && (
            <Button
              variant="outline"
              onClick={() => {
                onAssign();
                onOpenChange(false);
              }}
              className="h-12"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}

          {onService && (
            <Button
              variant="outline"
              onClick={() => {
                onService();
                onOpenChange(false);
              }}
              className="h-12"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Service
            </Button>
          )}
        </div>

        {/* More Options Button */}
        <Button
          variant="ghost"
          className="w-full mt-3 h-12"
          onClick={() => {
            // Handle more options
          }}
        >
          <MoreHorizontal className="h-4 w-4 mr-2" />
          More Options
        </Button>
      </SheetContent>
    </Sheet>
  );
};
