
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetAnalytics } from "@/components/fleet/FleetAnalytics";

export default function FleetAnalyticsPage() {
  useEffect(() => {
    document.title = "Fleet Analytics | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <FleetAnalytics />
    </FleetLayout>
  );
}
