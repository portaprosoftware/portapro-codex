
import React, { useState } from "react";
import { Plus, QrCode, Search, Filter, Edit, Trash, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditItemModal } from "./EditItemModal";
import { QRCodeDropdown } from "./QRCodeDropdown";
import { AttributeFilters } from "./AttributeFilters";

interface IndividualUnitsTabProps {
  productId: string;
}

export const IndividualUnitsTab: React.FC<IndividualUnitsTabProps> = ({ productId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [attributeFilters, setAttributeFilters] = useState<{
    color?: string;
    size?: string;
    material?: string;
    condition?: string;
  }>({});

  const { data: items, isLoading } = useQuery({
    queryKey: ["product-items", productId, searchQuery, availabilityFilter, attributeFilters],
    queryFn: async () => {
      let query = supabase
        .from("product_items")
        .select("*")
        .eq("product_id", productId);

      if (searchQuery) {
        query = query.or(`item_code.ilike.%${searchQuery}%,qr_code_data.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      if (availabilityFilter !== "all") {
        query = query.eq("status", availabilityFilter);
      }

      // Apply attribute filters
      if (attributeFilters.color) {
        query = query.eq("color", attributeFilters.color);
      }
      if (attributeFilters.size) {
        query = query.eq("size", attributeFilters.size);
      }
      if (attributeFilters.material) {
        query = query.eq("material", attributeFilters.material);
      }
      if (attributeFilters.condition) {
        query = query.eq("condition", attributeFilters.condition);
      }

      const { data, error } = await query.order("item_code");
      if (error) throw error;
      return data || [];
    }
  });

  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAttributeFilterChange = (key: string, value: string | undefined) => {
    setAttributeFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setAttributeFilters({});
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      available: "bg-blue-100 text-blue-700 border-blue-200",
      assigned: "bg-amber-100 text-amber-700 border-amber-200",
      maintenance: "bg-red-100 text-red-700 border-red-200"
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.available}>
        {status}
      </Badge>
    );
  };

  const getVariationText = (item: any) => {
    const variations = [];
    if (item.color) variations.push(item.color);
    if (item.size) variations.push(item.size);
    if (item.material) variations.push(item.material);
    
    return variations.length > 0 ? variations.join(", ") : "Not set";
  };

  if (isLoading) {
    return <div className="p-6">Loading units...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by item code, QR code, location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Availability" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Availability</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="maintenance">In Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <QrCode className="w-4 h-4 mr-2" />
            Scan QR
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Item
          </Button>
        </div>
      </div>

      {/* Attribute Filters */}
      <AttributeFilters
        filters={attributeFilters}
        onFilterChange={handleAttributeFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Units Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-medium">Item Code</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Variations</TableHead>
              <TableHead className="font-medium">Condition</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((item, index) => (
              <React.Fragment key={item.id}>
                <TableRow className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      {expandedRows.includes(item.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{item.item_code}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-gray-600">{getVariationText(item)}</TableCell>
                  <TableCell className="text-gray-600">{item.condition || "—"}</TableCell>
                  <TableCell>
                    <QRCodeDropdown itemCode={item.item_code} qrCodeData={item.qr_code_data} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() => setEditingItem(item.id)}
                      >
                        <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                        <Trash className="w-4 h-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Row Details */}
                {expandedRows.includes(item.id) && (
                  <TableRow className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell colSpan={8} className="border-t">
                      <div className="py-4 space-y-3 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <p className="text-gray-600 mt-1">{item.location || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">QR Code:</span>
                            <p className="text-gray-600 mt-1">{item.qr_code_data ? "Generated" : "Not generated"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">GPS Enabled:</span>
                            <p className="text-gray-600 mt-1">{item.gps_enabled ? "Yes" : "No"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Winterized:</span>
                            <p className="text-gray-600 mt-1">{item.winterized ? "Yes" : "No"}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <div>
                            <span className="font-medium text-gray-700">Notes:</span>
                            <p className="text-gray-600 mt-1">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        {(!items || items.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No individual units found. Create your first tracked item to get started.
          </div>
        )}
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          itemId={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};
