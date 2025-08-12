import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, Calendar, Clock, BarChart3, GraduationCap } from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'analytics' | 'training';

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
      title: "Analytics",
      value: "analytics" as TeamTab,
      icon: BarChart3,
      href: "/team-management/analytics"
    },
    {
      title: "Training",
      value: "training" as TeamTab,
      icon: GraduationCap,
      href: "/team-management/training"
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mt-6 mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">
              Team Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your team members, schedules, time off, and performance
            </p>
          </div>
        </div>
        
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
  );
};