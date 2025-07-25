import React, { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "./NotificationBell";

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
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo showText={false} />
        
        <div className="flex items-center gap-4">
          {user && role && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium capitalize shadow-sm">
              {role}
            </div>
          )}
          
          <NotificationBell />
          
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