import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Building2, Users, Bell, DollarSign, Clock } from "lucide-react";

const settingsSections = [
  {
    title: "Company Settings",
    description: "Company information and configuration",
    icon: Building2,
    color: "bg-gradient-primary",
    status: "Active"
  },
  {
    title: "Business Hours", 
    description: "Operating hours and schedules",
    icon: Clock,
    color: "bg-gradient-secondary",
    status: "Configured"
  },
  {
    title: "User Management",
    description: "Users, roles and permissions",
    icon: Users,
    color: "bg-gradient-accent", 
    status: "3 Users"
  },
  {
    title: "Notifications",
    description: "Alert preferences and settings",
    icon: Bell,
    color: "bg-gradient-warning",
    status: "Enabled"
  },
  {
    title: "Pricing Rules",
    description: "Discount and pricing management",
    icon: DollarSign,
    color: "bg-gradient-success",
    status: "2 Rules"
  }
];

export function SimplifiedSettings() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="text-muted-foreground">Manage your company settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${section.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary">{section.status}</Badge>
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}