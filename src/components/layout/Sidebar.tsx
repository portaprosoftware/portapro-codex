
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
  Droplets,
  ClipboardCheck,
  Warehouse,
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

  const menuSections = [
    {
      title: "DAY-TO-DAY",
      items: [
        { icon: Calendar, label: "Jobs", path: "/jobs" },
        { icon: Users, label: "Customers", path: "/customer-hub" },
        { icon: FileText, label: "Quotes & Invoices", path: "/quotes-invoices" },
      ]
    },
    {
      title: "INVENTORY",
      items: [
        { icon: Package, label: "Products", path: "/inventory" },
        { icon: Droplets, label: "Consumables", path: "/consumables" },
      ]
    },
    {
      title: "MANAGEMENT",
      items: [
        { icon: Truck, label: "Fleet Management", path: "/fleet-management" },
        { icon: ClipboardCheck, label: "Services Hub", path: "/maintenance-hub" },
      ]
    },
    {
      title: "ADMIN",
      items: [
        { icon: Megaphone, label: "Marketing", path: "/marketing" },
        { icon: BarChart3, label: "Analytics", path: "/analytics" },
        { icon: Warehouse, label: "Storage Garages", path: "/admin/storage-locations" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ]
    }
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "owner":
        return "Admin";
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
        <nav style={{ paddingLeft: '12px', paddingRight: '12px' }}>
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} style={{ marginBottom: '24px' }}>
              <div style={{ 
                paddingLeft: '12px', 
                paddingRight: '12px', 
                marginBottom: '8px' 
              }}>
                <h3 style={{ 
                  fontSize: '11px', 
                  fontWeight: '600', 
                  fontFamily: 'Inter, sans-serif',
                  color: '#71717a',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const
                }}>
                  {section.title}
                </h3>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {section.items.map((item, index) => (
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
            </div>
          ))}
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
