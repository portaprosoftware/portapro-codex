import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Clock, 
  FileText,
  GraduationCap
} from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'training' | 'custom-reports';

export const TeamManagementNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Extract current tab from URL
  const currentTab = (location.pathname.split('/').pop() as TeamTab) || 'users';

  const handleNavigation = (value: TeamTab) => {
    navigate(`/team-management/${value}`);
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
        
        <div className="flex items-center space-x-4">
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
      </div>
    </div>
  );
};