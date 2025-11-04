import React from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-right';
}

export const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  children,
  className,
  delay = 0,
  animation = 'fade-up'
}) => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });

  const animationClasses = {
    'fade-up': 'opacity-0 translate-y-8',
    'fade-in': 'opacity-0',
    'scale-in': 'opacity-0 scale-95',
    'slide-right': 'opacity-0 -translate-x-8'
  };

  const activeClasses = {
    'fade-up': 'opacity-100 translate-y-0',
    'fade-in': 'opacity-100',
    'scale-in': 'opacity-100 scale-100',
    'slide-right': 'opacity-100 translate-x-0'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isInView ? activeClasses[animation] : animationClasses[animation],
        className
      )}
      style={{
        transitionDelay: isInView ? `${delay}ms` : '0ms'
      }}
    >
      {children}
    </div>
  );
};
