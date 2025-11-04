import React from 'react';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/lib/utils';

interface ParallaxWrapperProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
}

export const ParallaxWrapper: React.FC<ParallaxWrapperProps> = ({
  children,
  className,
  speed = 0.5,
  direction = 'up'
}) => {
  const offset = useParallax({ speed, direction });

  return (
    <div
      className={cn('transition-transform duration-75 ease-linear', className)}
      style={{
        transform: `translateY(${offset}px)`
      }}
    >
      {children}
    </div>
  );
};
