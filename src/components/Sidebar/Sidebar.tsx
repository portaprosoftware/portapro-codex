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
import styles from "./Sidebar.module.css";

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  const menuItems: MenuItem[] = [
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
    <aside className={styles.sidebar}>
      {/* Logo Section */}
      <div className={styles.logo}>
        <Logo showText={true} className="w-full" />
      </div>

      {/* Navigation Section */}
      <div className={styles.navigation}>
        <div className={styles.navigationHeader}>
          <h3 className={styles.navigationTitle}>Navigation</h3>
        </div>
        
        <nav>
          <ul className={styles.navList}>
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <item.icon className={styles.navIcon} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* User Info Section */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userDetails}>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
            <div className={styles.userText}>
              <p className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={styles.userRole}>
                {role ? getRoleDisplayName(role) : "User"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className={styles.signOutButton}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;