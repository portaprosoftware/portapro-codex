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
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";

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
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Megaphone, label: "Marketing Hub", path: "/marketing-hub" },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-50 border-r border-gray-200 h-screen py-4">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">PortaPro</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.firstName}!</p>
      </div>

      <nav className="flex-1">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                  isActive(item.path) ? "bg-gray-100 font-medium" : ""
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto px-6 py-4">
        <div className="border-t border-gray-200 pt-4">
          <NavLink
            to="/settings"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
