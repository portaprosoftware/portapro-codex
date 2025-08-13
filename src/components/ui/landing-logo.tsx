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
          src="/lovable-uploads/62bc6422-ca64-450b-b038-8217a9bb2d17.png" 
          alt="PortaPro logo" 
          className="h-full w-auto object-contain"
          onLoad={() => console.log('PortaPro logo loaded successfully')}
          onError={(e) => console.error('PortaPro logo failed to load:', e)}
        />
      </div>
    </div>
  );
};