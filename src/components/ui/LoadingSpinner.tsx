import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('enterprise-spinner', sizeClasses[size], className)} />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('enterprise-job-card animate-pulse', className)}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 enterprise-skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="enterprise-skeleton h-4 w-24 rounded" />
          <div className="enterprise-skeleton h-3 w-16 rounded" />
        </div>
      </div>
      <div className="enterprise-skeleton h-6 w-16 rounded-full" />
    </div>
    
    <div className="space-y-2 mb-3">
      <div className="enterprise-skeleton h-3 w-32 rounded" />
      <div className="enterprise-skeleton h-3 w-28 rounded" />
    </div>
    
    <div className="flex space-x-2">
      <div className="enterprise-skeleton h-8 flex-1 rounded" />
      <div className="enterprise-skeleton h-8 flex-1 rounded" />
    </div>
  </div>
);