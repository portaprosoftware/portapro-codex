import React from "react";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

export default function Marketing() {
  const { hasAdminAccess } = useUserRole();

  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MarketingDashboard />;
}