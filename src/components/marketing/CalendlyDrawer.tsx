import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] max-h-[90vh]">
        <DrawerHeader className="border-b pb-3 relative">
          <DrawerTitle>Schedule a Demo</DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-3"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>
        
        <div className="w-full flex-1 overflow-auto px-4 py-2">
          <iframe
            src="https://calendly.com/portapro/portapro-software-demo?month=2025-10"
            className="w-full h-full min-h-[600px] border-0 rounded-lg"
            title="Schedule a Demo"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
