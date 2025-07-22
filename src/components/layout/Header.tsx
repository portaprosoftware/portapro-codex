import React from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

export const Header: React.FC = () => {
  const { user } = useUser();
  const { role } = useUserRole();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "destructive";
      case "dispatch":
        return "default";
      case "driver":
        return "secondary";
      case "customer":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <header className="border-b border-white/10 sticky top-0 z-50" style={{ background: 'linear-gradient(90deg, #1f2937 0%, #2c3e50 50%, #1f2937 100%)' }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        
        <div className="flex items-center gap-4">
          {user && role && (
            <Badge variant={getRoleBadgeVariant(role)} className="capitalize">
              {role}
            </Badge>
          )}
          
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
};