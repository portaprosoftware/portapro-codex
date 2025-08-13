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
        {variant === 'footer' ? (
          <img 
            src="/lovable-uploads/949b152d-dd96-4170-bd21-9c1982ebd847.png" 
            alt="PortaPro footer logo" 
            className="h-full w-auto object-contain"
          />
        ) : (
          <img 
            src="/lovable-uploads/8fecc290-9e53-4e50-a078-5c2fba112c80.png" 
            alt="PortaPro logo" 
            className="h-full w-auto object-contain"
          />
        )}
      </div>
    </div>
  );
};