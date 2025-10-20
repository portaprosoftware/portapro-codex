import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Clock, 
  FileText,
  GraduationCap,
  Menu
} from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'training' | 'custom-reports';

export const TeamManagementNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigationItems = [
    {
      title: "Users",
      value: "users" as TeamTab,
      icon: Users,
      href: "/team-management/users"
    },
    {
      title: "Scheduling",
      value: "scheduling" as TeamTab,
      icon: Calendar,
      href: "/team-management/scheduling"
    },
    {
      title: "Time Off", 
      value: "time-off" as TeamTab,
      icon: Clock,
      href: "/team-management/time-off"
    },
    {
      title: "Training",
      value: "training" as TeamTab,
      icon: GraduationCap,
      href: "/team-management/training"
    },
    {
      title: "Custom Reports",
      value: "custom-reports" as TeamTab,
      icon: FileText,
      href: "/team-management/custom-reports"
    }
  ];

  // Extract current tab from URL - handle nested routes like /users/:id
  const getActiveTab = (): TeamTab => {
    if (location.pathname.includes('/team-management/users')) return 'users';
    if (location.pathname.includes('/team-management/scheduling')) return 'scheduling';
    if (location.pathname.includes('/team-management/time-off')) return 'time-off';
    if (location.pathname.includes('/team-management/training')) return 'training';
    if (location.pathname.includes('/team-management/custom-reports')) return 'custom-reports';
    return 'users';
  };
  
  const currentTab = getActiveTab();

  const handleNavigation = (value: TeamTab) => {
    navigate(`/team-management/${value}`);
    setSheetOpen(false);
  };

  const isActiveRoute = (value: TeamTab) => {
    return currentTab === value;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 font-inter">
              Team Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-inter mt-1">
              Manage your team members, schedules, time off, and performance
            </p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="enterprise-tabs">
            <TabNav ariaLabel="Team Management Navigation">
              {navigationItems.map((item) => (
                <TabNav.Item
                  key={item.value}
                  to={item.href}
                  isActive={isActiveRoute(item.value)}
                  onClick={() => handleNavigation(item.value)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </TabNav.Item>
              ))}
            </TabNav>
          </div>
        </div>

        {/* Mobile/Tablet Navigation - 75% Bottom Sheet */}
        <div className="lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between min-h-[44px]">
                <div className="flex items-center gap-2">
                  {navigationItems.find(item => isActiveRoute(item.value))?.icon && (
                    React.createElement(navigationItems.find(item => isActiveRoute(item.value))!.icon, { className: "h-4 w-4" })
                  )}
                  <span>{navigationItems.find(item => isActiveRoute(item.value))?.title}</span>
                </div>
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Team Management</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.value}
                    variant={isActiveRoute(item.value) ? "default" : "ghost"}
                    className="w-full justify-start min-h-[56px]"
                    onClick={() => handleNavigation(item.value)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="text-base">{item.title}</span>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};