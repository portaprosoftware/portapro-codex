
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MaintenanceReportsTab } from "@/components/maintenance/MaintenanceReportsTab";
import { ServicesProvidedTab } from "@/components/maintenance/ServicesProvidedTab";
import { ReportTemplatesTab } from "@/components/maintenance/ReportTemplatesTab";
import { CreateServiceRecordModal } from "@/components/maintenance/CreateServiceRecordModal";
import { ImportReportsModal } from "@/components/maintenance/ImportReportsModal";
import { FileDown, Plus } from "lucide-react";

export default function MaintenanceHub() {
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [showImportReports, setShowImportReports] = useState(false);

  return (
    <div className="max-w-none px-4 md:px-6 py-6 min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 font-inter">Services Hub</h1>
            <p className="text-sm md:text-base text-gray-600 font-inter mt-1">Track completed work, manage your service offerings, and generate professional service reports</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              onClick={() => setShowImportReports(true)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Import Reports
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-4 py-2 w-full sm:w-auto"
              onClick={() => setShowCreateRecord(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Service Record
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="reports" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="bg-white rounded-full p-1 shadow-sm border min-w-max">
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-l-4 data-[state=active]:border-l-blue-400 rounded-full px-6 py-2 whitespace-nowrap"
            >
              Service Records
            </TabsTrigger>
            <TabsTrigger 
              value="services"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-l-4 data-[state=active]:border-l-blue-400 rounded-full px-6 py-2 whitespace-nowrap"
            >
              Services Offered
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-l-4 data-[state=active]:border-l-blue-400 rounded-full px-6 py-2 whitespace-nowrap"
            >
              Report Templates
            </TabsTrigger>
          </TabsList>
        </div>

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

      {/* Modals */}
      <CreateServiceRecordModal
        isOpen={showCreateRecord}
        onClose={() => setShowCreateRecord(false)}
      />
      
      <ImportReportsModal
        isOpen={showImportReports}
        onClose={() => setShowImportReports(false)}
      />
    </div>
  );
}
