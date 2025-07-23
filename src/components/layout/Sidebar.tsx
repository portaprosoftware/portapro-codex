
import React from "react";
import {
  Home,
  Calendar,
  Package,
  Users,
  FileText,
  Truck,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  Wrench,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useClerk, useUser, UserButton } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { useUserRole } from "@/hooks/useUserRole";

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { role } = useUserRole();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Calendar, label: "Jobs", path: "/jobs" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: Users, label: "Customer Hub", path: "/customer-hub" },
    { icon: FileText, label: "Quotes & Invoices", path: "/quotes-invoices" },
    { icon: Truck, label: "Fleet Management", path: "/fleet-management" },
    { icon: Wrench, label: "Maintenance Hub", path: "/maintenance-hub" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Megaphone, label: "Marketing Hub", path: "/marketing-hub" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "dispatch":
        return "Dispatch";
      case "driver":
        return "Driver";
      case "customer":
        return "Customer";
      default:
        return "User";
    }
  };

  return (
    <div className="sidebar fixed left-0 top-0 h-screen w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 flex-shrink-0 w-full">
        <Logo showText={true} className="w-full" />
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-6 mb-4">
          <h3 className="text-sm font-semibold font-inter" style={{ color: '#09090B' }}>Navigation</h3>
        </div>
        
        <nav className="sidebar-nav px-3">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? '#ffffff' : '#09090B'
                  })}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* User Info Section */}
      <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium font-inter" style={{ color: '#09090B' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 font-inter">
                {role ? getRoleDisplayName(role) : "User"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors p-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
