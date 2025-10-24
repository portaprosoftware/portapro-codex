import { X } from 'lucide-react';

interface CalendlyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendlyDrawer({ open, onOpenChange }: CalendlyDrawerProps) {

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Drawer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full h-screen lg:w-[75%] lg:h-[90vh] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-slide-in-bottom">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-foreground">Schedule a Demo</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendly Embed */}
        <div className="w-full h-[calc(100%-64px)]">
          <iframe
            src="https://calendly.com/portapro/portapro-software-demo?month=2025-10"
            className="w-full h-full border-0"
            title="Schedule a Demo"
          />
        </div>
      </div>
    </>
  );
}
