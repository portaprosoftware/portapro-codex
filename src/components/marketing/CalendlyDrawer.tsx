import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CalendlyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendlyDrawer({ open, onOpenChange }: CalendlyDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const init = () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      try {
        (window as any).Calendly?.initInlineWidget({
          url: 'https://calendly.com/portapro/portapro-software-demo?hide_event_type_details=1&hide_gdpr_banner=1',
          parentElement: containerRef.current,
        });
      } catch (e) {
        console.warn('Calendly init failed', e);
      }
    };

    const existing = document.querySelector(
      'script[src*="assets.calendly.com/assets/external/widget.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      if (!(window as any).Calendly) {
        existing.addEventListener('load', init, { once: true });
      } else {
        init();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.addEventListener('load', init, { once: true });
    document.body.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Drawer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full h-full lg:w-[75%] lg:h-[85vh] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-slide-in-bottom">
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
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minWidth: '320px', height: '100%' }}
          />
        </div>
      </div>
    </>
  );
}
