
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
  SprayCan,
  Settings2,
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
    { icon: SprayCan, label: "Consumables", path: "/consumables" },
    { icon: FileText, label: "Purchase Orders", path: "/purchase-orders" },
    { icon: Users, label: "Customer Hub", path: "/customer-hub" },
    { icon: FileText, label: "Quotes & Invoices", path: "/quotes-invoices" },
    { icon: Truck, label: "Fleet Management", path: "/fleet-management" },
    { icon: Settings2, label: "Services Hub", path: "/maintenance-hub" },
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

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    margin: '2px 8px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s ease',
    background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
    color: isActive ? '#ffffff' : '#09090B',
  });

  const navItemHoverStyle = {
    backgroundColor: '#f1f5f9',
  };

  return (
    <div style={{ 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      height: '100vh', 
      width: '256px', 
      backgroundColor: '#f9fafb', 
      borderRight: '1px solid #e5e7eb', 
      display: 'flex', 
      flexDirection: 'column' as const,
      zIndex: 50 
    }}>
      {/* Logo Section */}
      <div style={{ padding: '24px', flexShrink: 0, width: '100%' }}>
        <Logo showText={true} className="w-full" />
      </div>

      {/* Navigation Section */}
      <div style={{ flex: 1, overflowY: 'auto' as const, paddingTop: '16px' }}>
        <div style={{ paddingLeft: '24px', paddingRight: '24px', marginBottom: '16px' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            fontFamily: 'Inter, sans-serif',
            color: '#09090B' 
          }}>
            Navigation
          </h3>
        </div>
        
        <nav style={{ paddingLeft: '12px', paddingRight: '12px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  style={({ isActive }) => navItemStyle(isActive)}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.style.background.includes('linear-gradient')) {
                      Object.assign(e.currentTarget.style, navItemHoverStyle);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.style.background.includes('linear-gradient')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <item.icon style={{ 
                    width: '20px', 
                    height: '20px', 
                    marginRight: '12px',
                    flexShrink: 0 
                  }} />
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
