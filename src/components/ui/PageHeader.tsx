import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex flex-col w-full gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
};