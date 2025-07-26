import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Edit, Mail, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CompanySettingsModal } from "@/components/settings/CompanySettingsModal";

export function CompanySettingsSection() {
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: companySettings, isLoading, error } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      console.log("Fetching company settings with full select...");
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();
      
      if (error) {
        console.error("Error fetching company settings:", error);
        throw error;
      }
      console.log("Company settings fetched:", data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime in v5)
    retry: 3,
  });

  console.log("CompanySettingsSection render:", { companySettings, isLoading, error });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Company Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatAddress = () => {
    if (!companySettings) return "No address set";
    
    const parts = [
      companySettings.company_street,
      companySettings.company_city,
      companySettings.company_state,
      companySettings.company_zipcode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(", ") : "No address set";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Company Information</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name and Basic Info Section */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground">
                {companySettings?.company_name || "Company Name Not Set"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {companySettings?.company_timezone ? 
                  `Timezone: ${companySettings.company_timezone.replace("America/", "").replace("_", " ")}` : 
                  "Timezone not set"
                }
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Contact Information</span>
              </h4>
              <div className="space-y-2 pl-6">
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="text-sm">{companySettings?.company_email || "Not set"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <p className="text-sm">{companySettings?.company_phone || "Not set"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Support Email:</span>
                  <p className="text-sm">{companySettings?.support_email || "Not set"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </h4>
              <div className="pl-6">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {formatAddress()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CompanySettingsModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        companySettings={companySettings}
      />
    </>
  );
}