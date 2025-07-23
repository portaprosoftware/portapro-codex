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
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md overflow-hidden">
        {companySettings?.company_logo ? (
          <img 
            src={companySettings.company_logo} 
            alt="Company logo" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-4 h-4 bg-white rounded-sm"></div>
        )}
      </div>
      {showText && (
        <span className="font-inter font-bold text-xl text-foreground">
          {companySettings?.company_name || "PortaPro"}
        </span>
      )}
    </div>
  );
};