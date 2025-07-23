import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", showText = true }) => {
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_logo, company_name')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className={`flex items-center ${className}`}>
      <div className="h-8 flex items-center justify-start overflow-hidden">
        {companySettings?.company_logo ? (
          <img 
            src={companySettings.company_logo} 
            alt="Company logo" 
            className="h-full w-auto object-contain"
          />
        ) : (
          <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-sm"></div>
        )}
      </div>
      {showText && (
        <span className="font-inter font-semibold text-lg text-blue-700 ml-2">
          PortaPro
        </span>
      )}
    </div>
  );
};