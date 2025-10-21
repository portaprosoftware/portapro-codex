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
    <div className={`flex items-center shrink-0 ${className}`}>
      <div className="h-9 min-h-[35px] max-h-[35px] w-auto flex items-center justify-start overflow-hidden">
        {variant === 'footer' ? (
          <img 
            src="/lovable-uploads/bd35069b-599f-4b57-88be-7574eda2adf8.png?v=6" 
            alt="PortaPro logo" 
            height={35}
            className="h-9 min-h-[35px] max-h-[35px] w-auto object-contain shrink-0" 
            loading="eager"
            decoding="sync"
          />
        ) : (
          companySettings?.company_logo ? (
            <img 
              src={companySettings.company_logo} 
              alt="Company logo" 
              height={35}
              className="h-9 min-h-[35px] max-h-[35px] w-auto object-contain shrink-0" 
              loading="eager"
              decoding="sync"
            />
          ) : (
            <img 
              src="/lovable-uploads/bd35069b-599f-4b57-88be-7574eda2adf8.png?v=6" 
              alt="PortaPro logo" 
              height={35}
              className="h-9 min-h-[35px] max-h-[35px] w-auto object-contain shrink-0" 
              loading="eager"
              decoding="sync"
            />
          )
        )}
      </div>
    </div>
  );
};