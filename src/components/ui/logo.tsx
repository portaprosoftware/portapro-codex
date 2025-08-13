import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'header' | 'footer';
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showText = true,
  variant = 'header'
}) => {
  const { data: companySettings } = useQuery({
    queryKey: ['company-logo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_logo, company_name')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className={`flex items-center ${className}`}>
      <div className="h-8 flex items-center justify-start overflow-hidden">
        {variant === 'footer' ? (
          <img 
            src="/lovable-uploads/bd35069b-599f-4b57-88be-7574eda2adf8.png?v=6" 
            alt="PortaPro logo" 
            className="h-full w-auto object-contain" 
          />
        ) : (
          companySettings?.company_logo ? (
            <img 
              src={companySettings.company_logo} 
              alt="Company logo" 
              className="h-full w-auto object-contain" 
            />
          ) : (
            <img 
              src="/lovable-uploads/bd35069b-599f-4b57-88be-7574eda2adf8.png?v=6" 
              alt="PortaPro logo" 
              className="h-full w-auto object-contain" 
            />
          )
        )}
      </div>
    </div>
  );
};