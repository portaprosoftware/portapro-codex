import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LAST_ROUTE_KEY = 'portapro_last_route';

// Routes that should not be saved as "last route"
const PUBLIC_ROUTES = [
  '/landing',
  '/auth',
  '/payment',
  '/portal',
  '/help',
  '/features',
  '/about',
  '/blog',
  '/community',
  '/terms',
  '/privacy',
  '/security',
  '/scan',
  '/consumable-request',
  '/testing'
];

/**
 * Hook to track and persist the user's last visited route
 * Excludes public/auth routes to avoid redirect loops
 */
export const useLastRoute = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't save public routes or auth-related routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      location.pathname.startsWith(route)
    );

    if (!isPublicRoute && location.pathname !== '/') {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
    }
  }, [location.pathname]);
};

/**
 * Get the last saved route from localStorage
 */
export const getLastRoute = (): string | null => {
  return localStorage.getItem(LAST_ROUTE_KEY);
};

/**
 * Clear the last saved route from localStorage
 */
export const clearLastRoute = (): void => {
  localStorage.removeItem(LAST_ROUTE_KEY);
};
