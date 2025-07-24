import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings2, 
  Users, 
  Clock, 
  Calendar, 
  Bell, 
  DollarSign,
  QrCode,
  ChevronDown,
  Building2
} from "lucide-react";
import { CompanySettingsSection } from "@/components/settings/CompanySettingsSection";
import { BusinessHoursSection } from "@/components/settings/BusinessHoursSection";
import { UserManagementSection } from "@/components/settings/UserManagementSection";
import { NotificationPreferencesSection } from "@/components/settings/NotificationPreferencesSection";
import { PricingRulesSection } from "@/components/settings/PricingRulesSection";
import { DriverWorkingHoursSection } from "@/components/settings/DriverWorkingHoursSection";
import { DriverTimeOffSection } from "@/components/settings/DriverTimeOffSection";
import { QRFeedbackSection } from "@/components/settings/QRFeedbackSection";
import { useUserRole } from "@/hooks/useUserRole";

type SettingsSection = 
  | 'company'
  | 'business-hours' 
  | 'user-management' 
  | 'notifications' 
  | 'pricing-rules'
  | 'driver-hours'
  | 'time-off'
  | 'qr-feedback';

export default function Settings() {
  const { hasAdminAccess } = useUserRole();
  const [activeSection, setActiveSection] = useState<SettingsSection>('company');

  if (!hasAdminAccess) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const settingsSections = [
    { key: 'company' as const, label: 'Company Settings', icon: Building2 },
    { key: 'user-management' as const, label: 'User Management', icon: Users },
    { key: 'driver-hours' as const, label: 'Driver Working Hours', icon: Clock },
    { key: 'time-off' as const, label: 'Time Off Management', icon: Calendar },
    { key: 'notifications' as const, label: 'Notifications', icon: Bell },
    { key: 'pricing-rules' as const, label: 'Pricing Rules', icon: DollarSign },
    { key: 'business-hours' as const, label: 'Business Hours', icon: Clock },
    { key: 'qr-feedback' as const, label: 'QR Feedback', icon: QrCode },
  ];

  const currentSection = settingsSections.find(section => section.key === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'company':
        return <CompanySettingsSection />;
      case 'business-hours':
        return <BusinessHoursSection />;
      case 'user-management':
        return <UserManagementSection />;
      case 'notifications':
        return <NotificationPreferencesSection />;
      case 'pricing-rules':
        return <PricingRulesSection />;
      case 'driver-hours':
        return <DriverWorkingHoursSection onBack={() => setActiveSection('company')} />;
      case 'time-off':
        return <DriverTimeOffSection onBack={() => setActiveSection('company')} />;
      case 'qr-feedback':
        return <QRFeedbackSection />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-none px-6 py-6 space-y-6">
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Settings</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Configure your application settings</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {currentSection && <currentSection.icon className="h-4 w-4" />}
                {currentSection?.label || 'Select Section'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {settingsSections.map((section) => (
                <DropdownMenuItem
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="flex items-center gap-2"
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {renderSection()}
      </div>
    </Layout>
  );
}