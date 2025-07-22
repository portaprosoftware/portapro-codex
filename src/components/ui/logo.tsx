import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
        <div className="w-4 h-4 bg-white rounded-sm"></div>
      </div>
      {showText && (
        <span className="font-inter font-bold text-xl text-foreground">
          PortaPro
        </span>
      )}
    </div>
  );
};