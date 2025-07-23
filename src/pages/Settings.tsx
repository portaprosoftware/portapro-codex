import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Building2, Users, Bell, DollarSign, Clock } from "lucide-react";
import { SimplifiedSettings } from "@/components/settings/SimplifiedSettings";
import { useUserRole } from "@/hooks/useUserRole";

type SettingsSection = "company" | "business-hours" | "users" | "notifications" | "pricing";

const settingsSections = [
  {
    id: "company" as const,
    title: "Company Settings",
    description: "Company information, logo, and general settings",
    icon: Building2,
    color: "bg-gradient-primary",
    requiredRole: null
  },
  {
    id: "business-hours" as const,
    title: "Business Hours",
    description: "Operating hours and terms & conditions",
    icon: Clock,
    color: "bg-gradient-secondary",
    requiredRole: "owner"
  },
  {
    id: "users" as const,
    title: "User Management",
    description: "Manage users, roles, and permissions",
    icon: Users,
    color: "bg-gradient-accent",
    requiredRole: "owner"
  },
  {
    id: "notifications" as const,
    title: "Notifications",
    description: "Configure notification preferences and alerts",
    icon: Bell,
    color: "bg-gradient-warning",
    requiredRole: null
  },
  {
    id: "pricing" as const,
    title: "Pricing Rules",
    description: "Manage pricing rules and discounts",
    icon: DollarSign,
    color: "bg-gradient-success",
    requiredRole: "owner"
  }
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("company");
  const { hasAdminAccess, isOwner } = useUserRole();

  const filteredSections = settingsSections.filter(section => {
    if (!section.requiredRole) return true;
    if (section.requiredRole === "owner") return isOwner;
    return hasAdminAccess;
  });

  const renderActiveSection = () => {
    switch (activeSection) {
      case "company":
        return <CompanySettingsSection />;
      case "business-hours":
        return <BusinessHoursSection />;
      case "users":
        return <UserManagementSection />;
      case "notifications":
        return <NotificationPreferencesSection />;
      case "pricing":
        return <PricingRulesSection />;
      default:
        return <CompanySettingsSection />;
    }
  };

  return (
    <Layout>
      <SimplifiedSettings />
    </Layout>
  );
}