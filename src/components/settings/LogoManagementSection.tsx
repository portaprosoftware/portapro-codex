import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Edit } from "lucide-react";
import { LogoManagementModal } from "@/components/settings/LogoManagementModal";
import { useCompanySettings } from "@/hooks/useCompanySettings";

export function LogoManagementSection() {
  const [showLogoModal, setShowLogoModal] = useState(false);

  const { data: companySettings, isLoading } = useCompanySettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
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
            <CardTitle className="flex items-center space-x-2 text-lg">
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
              {companySettings?.company_logo ? (
                <img 
                  src={companySettings.company_logo} 
                  alt="Company logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {companySettings?.company_logo ? "Logo uploaded" : "No logo uploaded"}
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
        currentLogo={companySettings}
      />
    </>
  );
}