import React from 'react';
import { BrowserRouter } from 'react-router-dom';

interface RouterSelectorProps {
  children: React.ReactNode;
}

/**
 * RouterSelector: Always uses BrowserRouter for clean URL routing.
 * SPA fallback is configured via vercel.json rewrites.
 */
export const RouterSelector: React.FC<RouterSelectorProps> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};
