
import React, { useState } from "react";
import { Plus, Search, Filter, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddVariationModal } from "./AddVariationModal";
import { EditVariationModal } from "./EditVariationModal";
import { DeleteVariationDialog } from "./DeleteVariationDialog";

interface ProductAttributesTabProps {
  productId: string;
}

export const ProductAttributesTab: React.FC<ProductAttributesTabProps> = ({ productId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [attributeFilter, setAttributeFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<{ id: string; name: string; values: string[]; required: boolean } | null>(null);
  const [variationToDelete, setVariationToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch real product attributes from Supabase
  const { data: rawAttributes = [], isLoading } = useQuery({
    queryKey: ['product-attributes', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_properties')
        .select('*')
        .eq('product_id', productId);
      
      if (error) throw error;
      return data;
    }
  });

  // Group attributes by name to show them in table format
  const attributes = React.useMemo(() => {
    const grouped = rawAttributes.reduce((acc, attr) => {
      if (!acc[attr.attribute_name]) {
        acc[attr.attribute_name] = {
          id: attr.attribute_name,
          name: attr.attribute_name,
          values: [],
          required: false
        };
      }
      acc[attr.attribute_name].values.push(attr.attribute_value);
      if (attr.is_required) {
        acc[attr.attribute_name].required = true;
      }
      return acc;
    }, {} as Record<string, { id: string; name: string; values: string[]; required: boolean }>);

    return Object.values(grouped);
  }, [rawAttributes]);

  // Update required status mutation
  const updateRequiredMutation = useMutation({
    mutationFn: async ({ attributeName, isRequired }: { attributeName: string, isRequired: boolean }) => {
      const { error } = await supabase
        .from('product_properties')
        .update({ is_required: isRequired })
        .eq('product_id', productId)
        .eq('attribute_name', attributeName);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
      toast.success("Attribute requirement updated");
    },
    onError: () => {
      toast.error("Failed to update attribute requirement");
    }
  });

  const filteredAttributes = attributes.filter(attr => {
    if (searchQuery) {
      return attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             attr.values.some(value => value.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (attributeFilter === "required") {
      return attr.required;
    }
    if (attributeFilter === "optional") {
      return !attr.required;
    }
    return true;
  });

  const handleEditVariation = (attribute: { id: string; name: string; values: string[]; required: boolean }) => {
    setSelectedVariation(attribute);
    setIsEditModalOpen(true);
  };

  const handleDeleteVariation = (attributeName: string) => {
    setVariationToDelete(attributeName);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading attributes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Product Variations</h2>
            <p className="text-gray-600">Manage custom properties and variations that can be applied to individual items of this product type.</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variation
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search variations by name or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={attributeFilter} onValueChange={setAttributeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Variations" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Variations</SelectItem>
            <SelectItem value="required">Required Only</SelectItem>
            <SelectItem value="optional">Optional Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Attributes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium">Variation</TableHead>
              <TableHead className="font-medium">Values</TableHead>
              <TableHead className="font-medium">Required</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttributes.map((attribute, index) => (
              <TableRow key={attribute.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="font-medium">{attribute.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {attribute.values.map((value, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={attribute.required}
                      onCheckedChange={(checked) => 
                        updateRequiredMutation.mutate({ 
                          attributeName: attribute.name, 
                          isRequired: checked 
                        })
                      }
                      disabled={updateRequiredMutation.isPending}
                    />
                    {attribute.required ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200">Required</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-300">Optional</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-6 h-6 p-0"
                      onClick={() => handleEditVariation(attribute)}
                    >
                      <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-6 h-6 p-0"
                      onClick={() => handleDeleteVariation(attribute.name)}
                    >
                      <Trash className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAttributes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchQuery || attributeFilter !== "all" 
              ? "No variations found matching your criteria."
              : "No variations defined yet. Add your first variation to get started."
            }
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">About Product Variations</h4>
        <p className="text-gray-600 text-sm">
          Variations allow you to track variations and properties of individual items. 
          For example, you might track color, size, or condition. Required variations must be set for each individual item, 
          while optional variations can be left blank.
        </p>
      </div>

      {/* Add Variation Modal */}
      <AddVariationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        productId={productId}
      />

      {/* Edit Variation Modal */}
      <EditVariationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVariation(null);
        }}
        productId={productId}
        variation={selectedVariation}
      />

      {/* Delete Variation Dialog */}
      <DeleteVariationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setVariationToDelete(null);
        }}
        productId={productId}
        variationName={variationToDelete}
      />
    </div>
  );
};
