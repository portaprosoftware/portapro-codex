import { useEffect } from 'react';

/**
 * Hook to detect if the app is running as an installed PWA (standalone mode)
 * and apply native-app-like behaviors such as zoom locking and gesture blocking.
 * 
 * This hook only modifies behavior when the app is installed, preserving
 * accessibility features for regular website usage.
 */
export const usePWAStandalone = () => {
  useEffect(() => {
    // Detect if running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true; // iOS fallback

    if (!isStandalone) {
      console.log('🌐 Running in browser mode - zoom enabled for accessibility');
      return;
    }

    console.log('📱 Running in PWA standalone mode - applying native app behaviors');

    // 1. Lock viewport zoom for native app feel
    const viewportTag = document.querySelector('meta[name="viewport"]');
    if (viewportTag) {
      viewportTag.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }

    // 2. Block iOS gesture zoom events
    const preventGesture = (e: Event) => e.preventDefault();

    // iOS-specific gesture events
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });

    // 3. Prevent double-tap zoom
    let lastTouch = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouch < 350) {
        e.preventDefault();
      }
      lastTouch = now;
    };
    document.addEventListener('touchend', onTouchEnd, { passive: false });

    // Cleanup on unmount
    return () => {
      // Restore original viewport
      if (viewportTag) {
        viewportTag.setAttribute(
          'content',
          'width=device-width, initial-scale=1, viewport-fit=cover'
        );
      }

      // Remove event listeners
      document.removeEventListener('gesturestart', preventGesture as any);
      document.removeEventListener('gesturechange', preventGesture as any);
      document.removeEventListener('gestureend', preventGesture as any);
      document.removeEventListener('touchend', onTouchEnd as any);
    };
  }, []);

  // Return standalone status for conditional rendering if needed
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  return { isStandalone };
};
