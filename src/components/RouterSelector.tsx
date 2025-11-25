import type { FC, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

interface RouterSelectorProps {
  children: ReactNode;
}

/**
 * Always uses BrowserRouter to avoid recursive Clerk redirect rewrites
 * while keeping clean URL routing. SPA fallback is configured via vercel.json rewrites.
 */
export const RouterSelector: FC<RouterSelectorProps> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};
