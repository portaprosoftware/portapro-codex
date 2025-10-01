import React from "react";
import { cn } from "@/lib/utils";

export type RoleType = 'driver' | 'dispatcher' | 'admin' | 'safety';

interface RoleBadgeProps {
  role: RoleType;
  className?: string;
}

const roleConfig: Record<RoleType, { label: string; gradient: string }> = {
  driver: {
    label: "Driver",
    gradient: "bg-gradient-to-r from-orange-500 to-orange-600"
  },
  dispatcher: {
    label: "Dispatcher",
    gradient: "bg-gradient-to-r from-blue-500 to-blue-600"
  },
  admin: {
    label: "Admin",
    gradient: "bg-gradient-to-r from-green-500 to-green-600"
  },
  safety: {
    label: "Safety",
    gradient: "bg-gradient-to-r from-yellow-500 to-yellow-600"
  }
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const config = roleConfig[role];
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm",
        config.gradient,
        className
      )}
    >
      {config.label}
    </span>
  );
};
