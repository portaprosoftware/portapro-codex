import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
interface LogoProps {
  className?: string;
  showText?: boolean;
}
export const Logo: React.FC<LogoProps> = ({
  className = "",
  showText = true
}) => {
  const {
    data: companySettings
  } = useQuery({
    queryKey: ['company-logo'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('company_settings').select('company_logo, company_name').single();
      if (error) throw error;
      return data;
    }
  });
  return <div className={`flex items-center ${className}`}>
      <div className="h-8 flex items-center justify-start overflow-hidden">
        <img src="/lovable-uploads/48ab2970-83e4-4001-b0e6-f3daaa7dd2d1.png" alt="PortaPro logo" className="h-full w-auto object-contain" />
      </div>
      {showText && (
        <span className="ml-2 font-semibold text-foreground">PortaPro</span>
      )}
    </div>;
};