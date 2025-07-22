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
  ChevronRight,
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
        path: "/jobs/calendar",
        icon: Calendar
      },
      {
        name: "Dispatch Board",
        path: "/jobs",
        icon: ClipboardList
      },
      {
        name: "Map View",
        path: "/jobs/map",
        icon: MapPin
      }
    ]
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Auto-expand the section that contains the active route
  React.useEffect(() => {
    sidebarItems.forEach(item => {
      if (item.subItems && item.subItems.some(subItem => 
          location.pathname === subItem.path || 
          (location.pathname.startsWith(subItem.path) && subItem.path !== '/')
        )) {
        setExpandedItems(prev => ({
          ...prev,
          [item.path]: true
        }));
      }
    });
  }, [location.pathname]);

  const filteredItems = sidebarItems.filter(item => 
    role && item.roles.includes(role)
  );

  const isSubItemActive = (path: string) => {
    return location.pathname === path || 
           (location.pathname.startsWith(path) && path !== '/');
  };

  const isMainItemActive = (item: SidebarItem) => {
    return location.pathname === item.path || 
           (location.pathname.startsWith(item.path) && item.path !== '/') ||
           (item.subItems && item.subItems.some(subItem => isSubItemActive(subItem.path)));
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16 overflow-y-auto font-inter">
      <nav className="p-4 space-y-1">
        {filteredItems.map((item) => (
          <React.Fragment key={item.path}>
            {item.subItems ? (
              <>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer",
                    "text-gray-700",
                    isMainItemActive(item) 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-sm" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => toggleExpand(item.path)}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", isMainItemActive(item) ? "text-white" : "text-gray-600")} />
                  <span className={isMainItemActive(item) ? "text-white" : "text-gray-700"}>
                    {item.name}
                  </span>
                  <div className="ml-auto">
                    {expandedItems[item.path] ? (
                      <ChevronDown className={cn("w-4 h-4", isMainItemActive(item) ? "text-white" : "text-gray-600")} />
                    ) : (
                      <ChevronRight className={cn("w-4 h-4", isMainItemActive(item) ? "text-white" : "text-gray-600")} />
                    )}
                  </div>
                </div>
                
                {/* Sub-items */}
                {expandedItems[item.path] && (
                  <div className="pl-10 space-y-1 mt-1">
                    {item.subItems.map(subItem => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 cursor-pointer",
                            isActive
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          )
                        }
                      >
                        <subItem.icon className="w-4 h-4 mr-2" />
                        <span>{subItem.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
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
          </React.Fragment>
        ))}
      </nav>
    </aside>
  );
};
