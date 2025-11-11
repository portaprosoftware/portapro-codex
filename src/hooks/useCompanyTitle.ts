import { useEffect } from 'react';
import { useCompanySettings } from './useCompanySettings';

/**
 * Hook to set the browser tab title - always shows 'PortaPro | Powering Portable Sanitation'
 */
export const useCompanyTitle = () => {
  const { data: companySettings } = useCompanySettings();
  
  useEffect(() => {
    // Always show the standard title
    document.title = 'PortaPro Software | Powering Portable Sanitation | Units, Fleet, Routes, Staff, Billing, Customer Portals & More';
  }, []);
};
