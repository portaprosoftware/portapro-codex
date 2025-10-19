import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';

interface RouterSelectorProps {
  children: React.ReactNode;
}

/**
 * RouterSelector: Conditionally uses HashRouter on production custom domain
 * to avoid 404s on refresh until hosting is configured for SPA fallback.
 * 
 * Once host rewrites are configured (e.g., _redirects or vercel.json),
 * this can be simplified to always use BrowserRouter.
 */
export const RouterSelector: React.FC<RouterSelectorProps> = ({ children }) => {
  const useHash = 
    import.meta.env.PROD && 
    window.location.hostname.endsWith('portaprosoftware.com');
 
  if (useHash) {
    return <HashRouter>{children}</HashRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
};
