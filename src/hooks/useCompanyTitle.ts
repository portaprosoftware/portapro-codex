import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanySettings } from './useCompanySettings';

/**
 * Hook to set the browser tab title to the company name
 * Falls back to 'PortaPro | Powering Portable Sanitation' on landing page
 * or 'PortaPro' on authenticated pages if company name is not available
 */
export const useCompanyTitle = () => {
  const { data: companySettings } = useCompanySettings();
  const location = useLocation();
  
  useEffect(() => {
    // Always show the standard title on landing page
    if (location.pathname === '/' || location.pathname === '/landing') {
      document.title = 'PortaPro | Powering Portable Sanitation';
    } else if (companySettings?.company_name) {
      document.title = companySettings.company_name;
    } else {
      document.title = 'PortaPro';
    }
  }, [companySettings?.company_name, location.pathname]);
};
