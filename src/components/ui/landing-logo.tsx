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
          src="/lovable-uploads/bd35069b-599f-4b57-88be-7574eda2adf8.png?v=6" 
          alt="PortaPro logo" 
          className="h-full w-auto object-contain" 
        />
      </div>
    </div>
  );
};