import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Wrench, 
  Fuel, 
  FileText,
  User,
  Plus,
  Eye,
  Download,
  Trash2
} from "lucide-react";

export default function TestingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("components");

  // Mock data for testing
  const mockVehicles = [
    { id: 1, license_plate: "OH-NSHD-04", make: "Isuzu", model: "NPR-HD", year: 2021, status: "available" },
    { id: 2, license_plate: "OH-SBYD-05", make: "Chevrolet", model: "Silverado 3500", year: 2020, status: "assigned" },
    { id: 3, license_plate: "OH-NSJY-06", make: "RAM", model: "5500 Utility", year: 2022, status: "maintenance" }
  ];

  const mockDocuments = [
    { id: 1, type: "Maintenance Receipt", vehicle: "OH-USHG-02", file: "Maintenance_Freightliner_M2_106.pdf" },
    { id: 2, type: "Warranty", vehicle: "OH-BSJT-01", file: "Warranty_Freightliner_M2_106.pdf" },
    { id: 3, type: "Insurance", vehicle: "OH-NSJY-06", file: "Insurance_RAM_5500.pdf" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Testing Sandbox</h1>
            <p className="text-gray-600">No Auth • No Database • Pure UI Testing</p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            🚀 Live Testing Environment
          </Badge>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="components">UI Components</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Cards</TabsTrigger>
            <TabsTrigger value="calendar">Calendar Testing</TabsTrigger>
            <TabsTrigger value="forms">Form Elements</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Button Variations */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Buttons</h3>
                <div className="space-y-3">
                  <Button className="w-full">Primary Button</Button>
                  <Button variant="outline" className="w-full">Outline Button</Button>
                  <Button variant="secondary" className="w-full">Secondary Button</Button>
                  <Button variant="destructive" className="w-full">Destructive Button</Button>
                </div>
              </Card>

              {/* Badge Variations */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Badges</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
                    <Badge className="bg-red-100 text-red-800">Maintenance</Badge>
                  </div>
                </div>
              </Card>

              {/* Icon Showcase */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Icons</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col items-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                    <span className="text-xs mt-1">Truck</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <span className="text-xs mt-1">Alert</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Wrench className="h-6 w-6 text-orange-600" />
                    <span className="text-xs mt-1">Maintenance</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Fuel className="h-6 w-6 text-green-600" />
                    <span className="text-xs mt-1">Fuel</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{vehicle.license_plate}</h4>
                          <p className="text-sm text-gray-600">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge 
                        className={
                          vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                          vehicle.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {vehicle.status}
                      </Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Calendar Component</h3>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-lg border w-full [&_table]:w-full [&_td]:text-center [&_th]:text-center [&_button]:h-10 [&_button]:w-10 [&_button]:text-sm pointer-events-auto"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day: "h-10 w-10 text-center text-sm p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                    }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Selected Date Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    <span>Selected: {selectedDate.toLocaleDateString()}</span>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This calendar uses the same styling as the vehicle assignment wizard.
                      Test different dates and styling changes here!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Form Elements</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Input Field</label>
                    <Input placeholder="Enter some text..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number Input</label>
                    <Input type="number" placeholder="Enter mileage..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Options</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Document Cards</h3>
                <div className="space-y-3">
                  {mockDocuments.map((doc) => (
                    <div key={doc.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{doc.type}</p>
                            <p className="text-xs text-gray-600">{doc.vehicle}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Footer */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Testing Environment Active</h4>
              <p className="text-sm text-gray-600">Make changes and see them instantly - no auth required!</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              ✅ Ready for Testing
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}