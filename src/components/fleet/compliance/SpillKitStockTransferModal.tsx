import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";

interface SpillKitStockTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItemId?: string;
  fromLocationId?: string;
  onSuccess: () => void;
}

export const SpillKitStockTransferModal: React.FC<SpillKitStockTransferModalProps> = ({
  open,
  onOpenChange,
  inventoryItemId,
  fromLocationId,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    inventory_item_id: inventoryItemId || "",
    from_location_id: fromLocationId || "",
    to_location_id: "",
    quantity: "",
    transfer_reason: "",
    notes: ""
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ['spill_kit_inventory_for_transfer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_inventory')
        .select('id, item_name')
        .order('item_name');
      if (error) throw error;
      return data;
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['storage-locations-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: currentStock } = useQuery({
    queryKey: ['current_stock', formData.inventory_item_id, formData.from_location_id],
    queryFn: async () => {
      if (!formData.inventory_item_id || !formData.from_location_id) return null;
      
      const { data, error } = await supabase
        .from('spill_kit_location_stock')
        .select('quantity')
        .eq('inventory_item_id', formData.inventory_item_id)
        .eq('storage_location_id', formData.from_location_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.inventory_item_id && !!formData.from_location_id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity);
      
      if (!quantity || quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      if (currentStock && quantity > currentStock.quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock.quantity}`);
      }

      if (formData.from_location_id === formData.to_location_id) {
        throw new Error("Cannot transfer to the same location");
      }

      // Create transfer record
      const { error: transferError } = await supabase
        .from('spill_kit_stock_transfers')
        .insert([{
          inventory_item_id: formData.inventory_item_id,
          from_location_id: formData.from_location_id || null,
          to_location_id: formData.to_location_id,
          quantity,
          transfer_reason: formData.transfer_reason || null,
          transferred_by: user?.id || null,
          notes: formData.notes || null
        }]);

      if (transferError) throw transferError;

      // Update stock at from location (if exists)
      if (formData.from_location_id) {
        const { error: fromError } = await supabase
          .from('spill_kit_location_stock')
          .update({ 
            quantity: (currentStock?.quantity || 0) - quantity 
          })
          .eq('inventory_item_id', formData.inventory_item_id)
          .eq('storage_location_id', formData.from_location_id);

        if (fromError) throw fromError;
      }

      // Update or insert stock at to location
      const { data: existingToStock } = await supabase
        .from('spill_kit_location_stock')
        .select('quantity')
        .eq('inventory_item_id', formData.inventory_item_id)
        .eq('storage_location_id', formData.to_location_id)
        .single();

      if (existingToStock) {
        const { error: toError } = await supabase
          .from('spill_kit_location_stock')
          .update({ 
            quantity: existingToStock.quantity + quantity 
          })
          .eq('inventory_item_id', formData.inventory_item_id)
          .eq('storage_location_id', formData.to_location_id);

        if (toError) throw toError;
      } else {
        const { error: insertError } = await supabase
          .from('spill_kit_location_stock')
          .insert([{
            inventory_item_id: formData.inventory_item_id,
            storage_location_id: formData.to_location_id,
            quantity
          }]);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Stock transferred successfully"
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Spill Kit Stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inventory_item_id">Inventory Item *</Label>
            <Select
              value={formData.inventory_item_id}
              onValueChange={(value) => setFormData({ ...formData, inventory_item_id: value })}
              disabled={!!inventoryItemId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item..." />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div>
              <Label htmlFor="from_location_id">From Location</Label>
              <Select
                value={formData.from_location_id}
                onValueChange={(value) => setFormData({ ...formData, from_location_id: value })}
                disabled={!!fromLocationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned Stock</SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentStock && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {currentStock.quantity}
                </p>
              )}
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground mb-2" />

            <div>
              <Label htmlFor="to_location_id">To Location *</Label>
              <Select
                value={formData.to_location_id}
                onValueChange={(value) => setFormData({ ...formData, to_location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity to Transfer *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <Label htmlFor="transfer_reason">Transfer Reason</Label>
            <Select
              value={formData.transfer_reason}
              onValueChange={(value) => setFormData({ ...formData, transfer_reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="relocation">Relocation</SelectItem>
                <SelectItem value="vehicle_load">Vehicle Load</SelectItem>
                <SelectItem value="consolidation">Consolidation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Transferring...' : 'Transfer Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
