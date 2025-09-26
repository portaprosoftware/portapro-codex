import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  pullDistance?: number;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDistance = 80,
  threshold = 60,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      e.preventDefault();
      const offset = Math.min(diff * 0.5, pullDistance);
      setPullOffset(offset);
    }
  }, [isPulling, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullOffset >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullOffset(0);
      }
    } else {
      setPullOffset(0);
    }
  }, [isPulling, pullOffset, threshold, onRefresh]);

  const refreshSpinClass = isRefreshing ? 'animate-spin' : '';
  const showRefresh = pullOffset > 20;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showRefresh && (
        <div
          className="flex justify-center items-center py-4 transition-all duration-200"
          style={{
            transform: `translateY(${Math.max(0, pullOffset - 20)}px)`,
            opacity: Math.min(1, pullOffset / threshold),
          }}
        >
          <RefreshCw className={`h-6 w-6 text-muted-foreground ${refreshSpinClass}`} />
        </div>
      )}
      
      <div
        style={{
          transform: `translateY(${pullOffset}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};