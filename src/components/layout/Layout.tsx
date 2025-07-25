
import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useUserRole } from "@/hooks/useUserRole";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { role, user } = useUserRole();
  const [activeSection, setActiveSection] = useState<string>('/');

  if (!role && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full" style={{ backgroundColor: '#f9fafb' }}>
        <AppSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
