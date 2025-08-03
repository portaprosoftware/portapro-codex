import React, { useEffect, useState } from 'react';

export function DropdownDebugger() {
  const [events, setEvents] = useState<string[]>([]);
  const [overlays, setOverlays] = useState<Element[]>([]);

  useEffect(() => {
    // 1. Add comprehensive event debugging
    const handleClick = (e: Event) => {
      const target = e.target as Element;
      const timestamp = new Date().toISOString().split('T')[1];
      setEvents(prev => [...prev.slice(-10), `${timestamp}: Click on ${target.tagName} (${target.className})`]);
    };

    const handlePointerDown = (e: Event) => {
      const target = e.target as Element;
      const timestamp = new Date().toISOString().split('T')[1];
      setEvents(prev => [...prev.slice(-10), `${timestamp}: PointerDown on ${target.tagName} (${target.className})`]);
    };

    // Capture events at document level
    document.addEventListener('click', handleClick, true);
    document.addEventListener('pointerdown', handlePointerDown, true);

    // 2. Check for invisible overlays
    const findOverlays = () => {
      const allElements = document.querySelectorAll('*');
      const suspiciousOverlays: Element[] = [];
      
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check for elements that could be blocking interactions
        if (
          (styles.position === 'fixed' || styles.position === 'absolute') &&
          (rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5) &&
          (styles.zIndex !== 'auto' && parseInt(styles.zIndex) > 10) &&
          (styles.pointerEvents !== 'none')
        ) {
          suspiciousOverlays.push(el);
        }
      });
      
      setOverlays(suspiciousOverlays);
    };

    findOverlays();
    const interval = setInterval(findOverlays, 2000);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      clearInterval(interval);
    };
  }, []);

  // 3. Clear all possible stuck modal states
  const clearAllModals = () => {
    // Clear any potential stuck states
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => {
      if (dialog.parentElement) {
        dialog.parentElement.style.display = 'none';
      }
    });

    // Clear Radix portals
    const radixPortals = document.querySelectorAll('[data-radix-portal]');
    radixPortals.forEach(portal => {
      portal.remove();
    });

    // Reset any CSS that might be blocking
    document.body.style.pointerEvents = '';
    document.documentElement.style.pointerEvents = '';
    
    setEvents(prev => [...prev, 'CLEARED: All modal states']);
  };

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg max-w-md z-[9999] text-xs">
      <div className="font-bold mb-2">Dropdown Debugger</div>
      
      <button 
        onClick={clearAllModals}
        className="bg-white text-red-500 px-2 py-1 rounded mb-2"
      >
        Clear All Modals
      </button>

      <div className="mb-2">
        <div className="font-semibold">Suspicious Overlays: {overlays.length}</div>
        {overlays.map((overlay, i) => (
          <div key={i} className="text-xs">
            {overlay.tagName} (z-index: {window.getComputedStyle(overlay).zIndex})
          </div>
        ))}
      </div>

      <div>
        <div className="font-semibold">Recent Events:</div>
        {events.slice(-5).map((event, i) => (
          <div key={i} className="text-xs">{event}</div>
        ))}
      </div>
    </div>
  );
}