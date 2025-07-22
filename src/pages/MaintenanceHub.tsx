
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MaintenanceReportsTab } from "@/components/maintenance/MaintenanceReportsTab";
import { ServicesProvidedTab } from "@/components/maintenance/ServicesProvidedTab";
import { ReportTemplatesTab } from "@/components/maintenance/ReportTemplatesTab";
import { FileDown, Plus } from "lucide-react";

export default function MaintenanceHub() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Maintenance Hub
          </h1>
          <p className="text-base text-gray-600">
            Track completed work, manage services, and generate professional reports
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
            <FileDown className="w-4 h-4 mr-2" />
            Import Reports
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />
            New Maintenance Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="bg-white rounded-full p-1 shadow-sm border">
          <TabsTrigger 
            value="reports" 
            className="data-[state=active]:bg-gray-100 data-[state=active]:border-l-4 data-[state=active]:border-l-blue-500 rounded-full px-6 py-2"
          >
            Maintenance Reports
          </TabsTrigger>
          <TabsTrigger 
            value="services"
            className="data-[state=active]:bg-gray-100 data-[state=active]:border-l-4 data-[state=active]:border-l-blue-500 rounded-full px-6 py-2"
          >
            Services Provided
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-gray-100 data-[state=active]:border-l-4 data-[state=active]:border-l-blue-500 rounded-full px-6 py-2"
          >
            Report Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <MaintenanceReportsTab />
        </TabsContent>

        <TabsContent value="services">
          <ServicesProvidedTab />
        </TabsContent>

        <TabsContent value="templates">
          <ReportTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
