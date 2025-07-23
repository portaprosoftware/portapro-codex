
import React from "react";
import Sidebar from "./Sidebar";
import { useUserRole } from "@/hooks/useUserRole";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { role, user } = useUserRole();

  if (!role && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="card text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome {user.firstName}!</h2>
          <p>Please contact your administrator to set your role, or go to your Clerk dashboard and add:</p>
          <code className="block bg-gray-100 p-4 rounded">publicMetadata: {`{"role": "owner"}`}</code>
          <p className="text-sm text-gray-500">Valid roles: owner, dispatch, driver, customer</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f9fafb' }}>
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="container-modern">
          {children}
        </div>
      </main>
    </div>
  );
};
