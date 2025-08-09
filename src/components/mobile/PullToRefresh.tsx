import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  refreshThreshold?: number;
  enabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  refreshThreshold = 80,
  enabled = true
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isScrolledToTop = useRef(true);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    isScrolledToTop.current = scrollTop === 0;
    
    if (isScrolledToTop.current) {
      startY.current = e.touches[0].clientY;
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isScrolledToTop.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(diff, refreshThreshold * 1.5));
    }
  }, [enabled, refreshThreshold, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPulling || isRefreshing) return;
    
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [enabled, isPulling, isRefreshing, pullDistance, refreshThreshold, onRefresh]);

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);
  const shouldShowRefreshIndicator = isPulling || isRefreshing;

  return (
    <div
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: shouldShowRefreshIndicator ? `translateY(${Math.min(pullDistance, 60)}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {/* Refresh Indicator */}
      {shouldShowRefreshIndicator && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-gradient-to-b from-primary/10 to-transparent z-10"
          style={{
            transform: `translateY(-${60 - Math.min(pullDistance, 60)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-primary">
            <RotateCcw 
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isRefreshing && 'animate-spin',
                !isRefreshing && `rotate-${Math.floor(refreshProgress * 360)}`
              )}
              style={{
                transform: !isRefreshing ? `rotate(${refreshProgress * 360}deg)` : undefined
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing 
                ? 'Refreshing...' 
                : pullDistance >= refreshThreshold 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'
              }
            </span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};