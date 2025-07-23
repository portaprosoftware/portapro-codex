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
    <div className={`flex flex-col items-start gap-2 w-full ${className}`}>
      <div className="w-full h-12 flex items-center justify-start overflow-hidden">
        {companySettings?.company_logo ? (
          <img 
            src={companySettings.company_logo} 
            alt="Company logo" 
            className="h-full w-auto object-contain"
          />
        ) : (
          <div className="w-8 h-4 bg-gradient-primary rounded-sm"></div>
        )}
      </div>
      {showText && (
        <span className="font-inter font-normal text-base text-foreground text-left leading-tight w-full">
          {companySettings?.company_name || "PortaPro"}
        </span>
      )}
    </div>
  );
};