import { useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface CalendlyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendlyDrawer({ open, onOpenChange }: CalendlyDrawerProps) {
  useEffect(() => {
    // Load Calendly script dynamically when drawer opens
    if (open && !document.querySelector('script[src*="calendly"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Schedule a Demo</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="calendly-inline-widget w-full h-full"
            data-url="https://calendly.com/portapro/portapro-software-demo?hide_event_type_details=1&hide_gdpr_banner=1"
            style={{ minWidth: '320px', height: '100%' }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
