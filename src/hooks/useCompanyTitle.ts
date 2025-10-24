import { useEffect } from 'react';
import { useCompanySettings } from './useCompanySettings';

/**
 * Hook to set the browser tab title to the company name
 * Falls back to 'PortaPro' if company name is not available
 */
export const useCompanyTitle = () => {
  const { data: companySettings } = useCompanySettings();
  
  useEffect(() => {
    if (companySettings?.company_name) {
      document.title = companySettings.company_name;
    } else {
      document.title = 'PortaPro';
    }
  }, [companySettings?.company_name]);
};
