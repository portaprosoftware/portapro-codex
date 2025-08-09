import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLoadingSkeletonProps {
  variant?: 'card' | 'list' | 'form' | 'table';
  count?: number;
  className?: string;
}

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

export const MobileLoadingSkeleton: React.FC<MobileLoadingSkeletonProps> = ({
  variant = 'card',
  count = 3,
  className
}) => {
  const renderCardSkeleton = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="bg-white rounded-lg border divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border space-y-4">
      <Skeleton className="h-6 w-48" />
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border-b last:border-b-0">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const skeletonVariants = {
    card: renderCardSkeleton,
    list: renderListSkeleton,
    form: renderFormSkeleton,
    table: renderTableSkeleton
  };

  return (
    <div className={cn("space-y-4", className)}>
      {variant === 'card' || variant === 'form' || variant === 'table' 
        ? skeletonVariants[variant]()
        : Array.from({ length: count }).map((_, i) => (
            <div key={i}>
              {skeletonVariants[variant]()}
            </div>
          ))
      }
    </div>
  );
};

// Specific mobile-optimized skeletons
export const MobileJobCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  </div>
);

export const MobileFleetCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);