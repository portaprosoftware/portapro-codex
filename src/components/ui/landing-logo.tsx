import React from "react";

interface LandingLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'header' | 'footer';
}

export const LandingLogo: React.FC<LandingLogoProps> = ({
  className = "",
  showText = true,
  variant = 'header'
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="h-8 flex items-center justify-start overflow-hidden">
        <img 
          src="/lovable-uploads/bba9759b-f689-4bca-9769-3fdfdb280b94.png" 
          alt="PortaPro logo" 
          className="h-full w-auto object-contain" 
        />
      </div>
    </div>
  );
};