
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetAnalytics } from "@/components/fleet/FleetAnalytics";

export default function FleetAnalyticsPage() {
  return (
    <FleetLayout>
      <FleetAnalytics />
    </FleetLayout>
  );
}
