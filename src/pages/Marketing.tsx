import React from "react";
import { TemplateManagement } from "@/components/marketing/TemplateManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

export default function Marketing() {
  const { hasAdminAccess } = useUserRole();

  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Marketing Templates</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Manage and customize email and SMS templates for customer communications</p>
          </div>
        </div>
      </div>

      {/* Template Management */}
      <TemplateManagement />
    </div>
  );
}