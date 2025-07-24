
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MaintenanceReportsTab } from "@/components/maintenance/MaintenanceReportsTab";
import { ServicesProvidedTab } from "@/components/maintenance/ServicesProvidedTab";
import { ReportTemplatesTab } from "@/components/maintenance/ReportTemplatesTab";
import { FileDown, Plus } from "lucide-react";

export default function MaintenanceHub() {
  return (
    <div className="max-w-none px-6 py-6 min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Maintenance Hub</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Track completed work, manage services, and generate professional reports</p>
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
