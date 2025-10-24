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
      <DrawerContent className="h-[100vh] max-h-[100vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Schedule a Demo</DrawerTitle>
        </DrawerHeader>
        
        <div className="w-full flex-1 overflow-hidden">
          <iframe
            src="https://calendly.com/portapro/portapro-software-demo?month=2025-10"
            className="w-full h-full border-0"
            title="Schedule a Demo"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
