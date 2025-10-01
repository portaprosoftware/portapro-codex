import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { DriverIncidentDashboard } from "./DriverIncidentDashboard";
import { IncidentsTab } from "./IncidentsTab";

/**
 * Smart router for incident management based on user role
 * - Drivers: Simple mobile dashboard with their own incidents
 * - Admins/Dispatchers/Owners: Full compliance incident management
 */
export const IncidentRoleGateway: React.FC = () => {
  const { isDriver, hasAdminAccess, isDispatcher, isOwner } = useUserRole();

  // Drivers get simplified mobile-first experience
  if (isDriver && !hasAdminAccess && !isDispatcher && !isOwner) {
    return <DriverIncidentDashboard />;
  }

  // Everyone else gets full incident management
  return <IncidentsTab />;
};
