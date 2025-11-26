
import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { Logo } from "@/components/ui/logo";
import { useUserRole } from "@/hooks/useUserRole";
import { UserButton, useUser } from "@clerk/clerk-react";
import { ArrowUp, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import "@/utils/authCleanup"; // Load auth cleanup utilities
import { getMarketingUrl } from "@/lib/config/domains";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('/');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const { role, user: roleUser, isLoaded } = useUserRole();
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // Show header on screens < 1024px (mobile + tablet)
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!role && roleUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome {roleUser.firstName}!</h2>
          <p>Please contact your administrator to set your role so we can finalize your access.</p>
          <p className="text-sm text-gray-500">Valid roles: owner, dispatch, driver, customer</p>
          {/* TODO: Replace with Supabase role lookup in next phase */}
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

  // Desktop layout with sidebar
  if (isDesktop) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-[#f9fafb]">
          <AppSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Mobile layout with bottom-up drawer
  return (
    <div className="min-h-screen flex flex-col w-full bg-[#f9fafb]">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-gray-50 px-4">
        <div className="flex items-center gap-3">
          <MobileNavDrawer />
          <Logo showText={true} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="flex items-center justify-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Bell className="w-6 h-6" />
          </button>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-10 h-10",
                userButtonPopoverCard: "shadow-lg"
              }
            }}
            afterSignOutUrl={getMarketingUrl()}
          />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pt-20 pb-24 sm:pb-20">
        {children}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-center border-t bg-gray-50 px-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center justify-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </footer>

      <Drawer open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DrawerContent className="h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>Notifications</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-gray-500 text-center">No notifications yet</p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
