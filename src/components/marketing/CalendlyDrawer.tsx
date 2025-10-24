import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CalendlyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendlyDrawer({ open, onOpenChange }: CalendlyDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-[900px] h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Schedule a Demo</DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-[calc(100%-64px)] overflow-hidden">
          <iframe
            src="https://calendly.com/portapro/portapro-software-demo?month=2025-10"
            className="w-full h-full border-0"
            title="Schedule a Demo"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
