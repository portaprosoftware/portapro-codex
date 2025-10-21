import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface CalendlyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendlyDrawer({ open, onOpenChange }: CalendlyDrawerProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="calendly"]');
    
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove the script on unmount to allow reuse
    };
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Drawer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-[65%] max-w-[900px] h-[60vh] md:w-[65%] md:h-[60vh] max-md:w-full max-md:h-[90vh] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-slide-in-bottom">
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
        <div className="h-[calc(100%-64px)] w-full">
          {scriptLoaded ? (
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/portapro/portapro-software-demo?hide_event_type_details=1&hide_gdpr_banner=1"
              style={{ minWidth: '320px', width: '100%', height: '100%' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
