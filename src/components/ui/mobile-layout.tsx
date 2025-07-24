import React from 'react';
import { cn } from '@/lib/utils';
import { Menu, Bell, User, Home, Calendar, Package, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MobileTopNavigation: React.FC = () => {
  const { hasAdminAccess } = useUserRole();

  const navigationItems = [
    { title: "Dashboard", href: "/", icon: Home },
    { title: "Jobs", href: "/jobs", icon: Calendar },
    { title: "Inventory", href: "/inventory", icon: Package },
    { title: "Settings", href: "/settings", icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || hasAdminAccess);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-14">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left side - Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <div className="flex flex-col h-full">
              <div className="border-b border-border pb-4 mb-4">
                <h2 className="font-semibold text-lg">PortaPro</h2>
                <p className="text-sm text-muted-foreground">Mobile Navigation</p>
              </div>
              
              <nav className="flex-1 space-y-2">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm",
                        isActive 
                          ? "bg-gradient-primary text-white shadow-sm" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center - Logo/Title */}
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-lg">PortaPro</h1>
        </div>

        {/* Right side - Notifications & Profile */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-red text-white">
              3
            </Badge>
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

const MobileBottomNavigation: React.FC = () => {
  const { hasAdminAccess } = useUserRole();

  const bottomNavItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "Jobs", href: "/jobs", icon: Calendar },
    { title: "Inventory", href: "/inventory", icon: Package },
    { title: "Settings", href: "/settings", icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || hasAdminAccess);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="grid grid-cols-4 h-16">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

const MobileGestureArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPulling, setIsPulling] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientY < 100) { // Only trigger near top of screen
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const touch = e.touches[0];
    const distance = Math.max(0, touch.clientY - 100);
    setPullDistance(distance);
  };

  const handleTouchEnd = () => {
    if (pullDistance > 100) {
      // Trigger refresh
      window.location.reload();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 bg-gradient-primary text-white text-center py-2 text-sm transition-all duration-200"
          style={{ 
            transform: `translateY(${Math.min(pullDistance - 100, 0)}px)`,
            opacity: Math.min(pullDistance / 100, 1)
          }}
        >
          {pullDistance > 100 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
      {children}
    </div>
  );
};

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <MobileTopNavigation />
      
      <MobileGestureArea>
        <main className="pt-14 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </MobileGestureArea>
      
      <MobileBottomNavigation />
    </div>
  );
};

export { MobileTopNavigation, MobileBottomNavigation };