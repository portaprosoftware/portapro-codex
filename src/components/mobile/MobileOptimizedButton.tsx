import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MobileOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const MobileOptimizedButton: React.FC<MobileOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  loading = false,
  hapticFeedback = true,
  fullWidth = false,
  type = 'button'
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
    
    // Haptic feedback for mobile devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Short vibration
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleClick = async () => {
    if (onClick && !disabled && !loading) {
      await onClick();
    }
  };

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || loading}
      className={cn(
        // Base mobile optimizations
        'min-h-[44px] min-w-[44px]', // iOS Human Interface Guidelines minimum touch target
        'touch-manipulation', // Optimize touch handling
        'select-none', // Prevent text selection on mobile
        
        // Full width option
        fullWidth && 'w-full',
        
        // Visual feedback for touch
        isPressed && !disabled && 'transform scale-95 transition-transform duration-75',
        
        // Loading state
        loading && 'cursor-not-allowed',
        
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
};