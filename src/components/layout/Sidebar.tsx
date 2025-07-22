import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Truck, 
  Users, 
  Package, 
  FileText, 
  BarChart3, 
  Settings,
  ClipboardList,
  MessageSquare,
  ChevronDown,
  MapPin
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  subItems?: SidebarSubItem[];
}

interface SidebarSubItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home,
    roles: ["owner", "dispatch", "driver", "customer"]
  },
  {
    name: "Jobs",
    path: "/jobs",
    icon: ClipboardList,
    roles: ["owner", "dispatch", "driver"],
    subItems: [
      {
        name: "Calendar View",
        path: "/jobs",
        icon: Calendar
      },
      {
        name: "Dashboard",
        path: "/jobs/dashboard",
        icon: BarChart3
      },
      {
        name: "Map View",
        path: "/jobs/map",
        icon: MapPin
      }
    ]
  },
  {
    name: "Calendar",
    path: "/calendar",
    icon: Calendar,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Fleet Management",
    path: "/fleet",
    icon: Truck,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Customers",
    path: "/customers",
    icon: Users,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Package,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Quotes & Invoices",
    path: "/quotes",
    icon: FileText,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Marketing",
    path: "/marketing",
    icon: MessageSquare,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["owner"]
  }
];

export const Sidebar: React.FC = () => {
  const { role } = useUserRole();
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Check if any subpath of Jobs is active
  const isJobsActive = location.pathname.startsWith('/jobs');

  // Set Jobs expanded by default if we're on a jobs page
  React.useEffect(() => {
    if (isJobsActive) {
      setExpandedItem('Jobs');
    }
  }, [isJobsActive]);

  const toggleExpand = (itemName: string) => {
    setExpandedItem(prev => prev === itemName ? null : itemName);
  };

  const filteredItems = sidebarItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16 overflow-y-auto font-inter">
      <nav className="p-4 space-y-1">
        {filteredItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = location.pathname === item.path || 
                          (hasSubItems && item.path !== '/jobs' && location.pathname.startsWith(item.path)) ||
                          (item.path === '/jobs' && isJobsActive);
          const isExpanded = expandedItem === item.name || (isJobsActive && item.name === 'Jobs');
          
          return (
            <div key={item.path} className="flex flex-col">
              {hasSubItems ? (
                <div 
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer",
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-sm" 
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => toggleExpand(item.name)}
                >
                  <div className="flex items-center">
                    <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-600")} />
                    <span className={isActive ? "text-white" : "text-gray-700"}>{item.name}</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 transition-transform", 
                      isExpanded ? "transform rotate-180" : "",
                      isActive ? "text-white" : "text-gray-500"
                    )} 
                  />
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer",
                      "text-gray-700",
                      isActive 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-sm" 
                        : "hover:bg-gray-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-600")} />
                      <span className={isActive ? "text-white" : "text-gray-700"}>{item.name}</span>
                    </>
                  )}
                </NavLink>
              )}

              {/* Render subitems if expanded */}
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-1 pl-4 border-l border-gray-200 space-y-1">
                  {item.subItems?.map((subItem) => {
                    const isSubItemActive = location.pathname === subItem.path;
                    
                    return (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 cursor-pointer",
                            isActive 
                              ? "bg-blue-50 text-blue-700 font-medium" 
                              : "hover:bg-gray-50 text-gray-700"
                          )
                        }
                      >
                        <subItem.icon className={cn("w-4 h-4 mr-2", isSubItemActive ? "text-blue-600" : "text-gray-500")} />
                        <span>{subItem.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};