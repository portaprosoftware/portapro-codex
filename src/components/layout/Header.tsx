import React, { useState, useEffect } from "react";
import { UserButton, useUser, useOrganization, useOrganizationList, useClerk } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "./NotificationBell";
import { ChevronDown, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header: React.FC = () => {
  const { user } = useUser();
  const { role } = useUserRole();
  const { organization } = useOrganization();
  const { userMemberships } = useOrganizationList({ userMemberships: { infinite: true } });
  const { setActive } = useClerk();

  const handleOrganizationSwitch = async (orgId: string, orgSlug: string) => {
    try {
      await setActive({ organization: orgId });
      window.location.href = `https://${orgSlug}.portaprosoftware.com/dashboard`;
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

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

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo showText={false} />
          
          {organization && userMemberships && userMemberships.data && userMemberships.data.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{organization.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-background">
                {userMemberships.data.map((membership) => (
                  <DropdownMenuItem
                    key={membership.organization.id}
                    onClick={() => handleOrganizationSwitch(
                      membership.organization.id,
                      membership.organization.slug || membership.organization.id
                    )}
                    className={
                      membership.organization.id === organization.id
                        ? "bg-muted font-medium"
                        : ""
                    }
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {membership.organization.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user && role && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium capitalize shadow-sm">
              {getRoleDisplayName(role)}
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