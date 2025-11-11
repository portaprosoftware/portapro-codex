import React from "react";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useParams } from "react-router-dom";
import CampaignDetail from "./marketing/campaign-detail";

export default function Marketing() {
  const { hasAdminAccess } = useUserRole();
  const { campaignId } = useParams<{ campaignId: string }>();

  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // If we have a campaignId, show the detail page
  if (campaignId) {
    return <CampaignDetail />;
  }

  return <MarketingDashboard />;
}