import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LogoManagementModal } from "@/components/settings/LogoManagementModal";

export function LogoManagementSection() {
  const [showLogoModal, setShowLogoModal] = useState(false);

  const { data: companyLogo, isLoading } = useQuery({
    queryKey: ["company-logo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("company_logo, company_name")
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Company Logo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>Company Logo</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLogoModal(true)}
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Change Logo</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 border border-dashed border-muted-foreground rounded-lg flex items-center justify-center bg-muted overflow-hidden">
              {companyLogo?.company_logo ? (
                <img 
                  src={companyLogo.company_logo} 
                  alt="Company logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-foreground">
                {companyLogo?.company_name || "Company Logo"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {companyLogo?.company_logo ? "Logo uploaded" : "No logo uploaded"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: PNG or JPG, max 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <LogoManagementModal 
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        currentLogo={companyLogo}
      />
    </>
  );
}