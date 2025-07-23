import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessMessageProps {
  message: string;
  onComplete?: () => void;
  duration?: number;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  onComplete, 
  duration = 2000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the message
    setIsVisible(true);

    // Hide the message after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-success text-success-foreground px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};