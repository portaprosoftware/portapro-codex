import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";

export const MaintenancePartsInventoryTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Parts Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Parts Catalog
          </CardTitle>
          <CardDescription>
            Manage maintenance parts inventory across all storage locations
          </CardDescription>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search parts..."
                className="pl-10"
              />
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Oil Filter - Standard</TableCell>
                <TableCell>OF-STD-001</TableCell>
                <TableCell>Filters</TableCell>
                <TableCell>45</TableCell>
                <TableCell>20</TableCell>
                <TableCell>$12.99</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">Edit</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Brake Pads - Heavy Duty</TableCell>
                <TableCell>BP-HD-003</TableCell>
                <TableCell>Brakes</TableCell>
                <TableCell>8</TableCell>
                <TableCell>15</TableCell>
                <TableCell>$89.99</TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">Edit</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Motor Oil - 5W30</TableCell>
                <TableCell>MO-5W30-QT</TableCell>
                <TableCell>Fluids</TableCell>
                <TableCell>156</TableCell>
                <TableCell>50</TableCell>
                <TableCell>$4.99</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">Edit</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock by Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock by Location</CardTitle>
            <CardDescription>
              Parts inventory across storage sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Main Warehouse</h4>
                  <p className="text-sm text-gray-600">1245 Industrial Blvd</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">287 items</p>
                  <p className="text-sm text-gray-600">15 part types</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Service Bay Storage</h4>
                  <p className="text-sm text-gray-600">Shop Floor A</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">156 items</p>
                  <p className="text-sm text-gray-600">8 part types</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Emergency Stock</h4>
                  <p className="text-sm text-gray-600">Quick Access Cabinet</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">45 items</p>
                  <p className="text-sm text-gray-600">12 part types</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Parts that need reordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-orange-900">Brake Pads - Heavy Duty</h4>
                  <p className="text-sm text-orange-600">8 left (reorder at 15)</p>
                </div>
                <Button size="sm" variant="outline">
                  Reorder
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-orange-900">Air Filter - Standard</h4>
                  <p className="text-sm text-orange-600">12 left (reorder at 25)</p>
                </div>
                <Button size="sm" variant="outline">
                  Reorder
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-orange-900">Transmission Fluid</h4>
                  <p className="text-sm text-orange-600">6 left (reorder at 20)</p>
                </div>
                <Button size="sm" variant="outline">
                  Reorder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parts Usage Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Parts Usage</CardTitle>
          <CardDescription>
            Parts used in recent maintenance jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Part Used</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Technician</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Jan 15, 2025</TableCell>
                <TableCell>Truck 101</TableCell>
                <TableCell>Oil Change</TableCell>
                <TableCell>Oil Filter - Standard</TableCell>
                <TableCell>1</TableCell>
                <TableCell>$12.99</TableCell>
                <TableCell>Mike Johnson</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jan 14, 2025</TableCell>
                <TableCell>Van 205</TableCell>
                <TableCell>Brake Service</TableCell>
                <TableCell>Brake Pads - Heavy Duty</TableCell>
                <TableCell>1 set</TableCell>
                <TableCell>$89.99</TableCell>
                <TableCell>Sarah Davis</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jan 13, 2025</TableCell>
                <TableCell>Truck 103</TableCell>
                <TableCell>Transmission Service</TableCell>
                <TableCell>Transmission Fluid</TableCell>
                <TableCell>4 quarts</TableCell>
                <TableCell>$47.96</TableCell>
                <TableCell>Mike Johnson</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};