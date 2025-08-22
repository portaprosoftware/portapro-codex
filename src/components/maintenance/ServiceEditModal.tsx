import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Save, X, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface ServiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: any;
  isCreating: boolean;
}

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({
  isOpen,
  onClose,
  service,
  isCreating,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "cleaning", // slug values like 'cleaning', 'preventive_maintenance', etc.
    pricing_method: "per_visit",
    default_rate: 0,
    estimated_duration: 60,
    default_template_id: "",
    consumables_recipe: {},
    evidence_requirements: {
      min_photos: 0,
      gps_required: false,
      signature_required: false,
    },
    eligible_targets: [] as string[],
    can_be_recurring: true,
  });

  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_report_templates')
        .select('id, name, template_type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (service && !isCreating) {
      setFormData({
        name: service.name || "",
        code: service.code || "",
        description: service.description || "",
        category: service.category || "cleaning",
        pricing_method: service.pricing_method || "per_visit",
        default_rate: service.default_rate || 0,
        estimated_duration: service.estimated_duration || 60,
        default_template_id: service.default_template_id || "",
        consumables_recipe: service.consumables_recipe || {},
        evidence_requirements: service.evidence_requirements || {
          min_photos: 0,
          gps_required: false,
          signature_required: false,
        },
        eligible_targets: service.eligible_targets || [],
        can_be_recurring: service.can_be_recurring !== false,
      });
    } else if (isCreating) {
      setFormData({
        name: "",
        code: "",
        description: "",
        category: "cleaning",
        pricing_method: "per_visit",
        default_rate: 0,
        estimated_duration: 60,
        default_template_id: "",
        consumables_recipe: {},
        evidence_requirements: {
          min_photos: 0,
          gps_required: false,
          signature_required: false,
        },
        eligible_targets: [],
        can_be_recurring: true,
      });
    }
  }, [service, isCreating]);

  // Auto-generate code on category change when creating and code is empty
  useEffect(() => {
    if (isCreating && formData.category && !formData.code) {
      generateNextServiceCode(formData.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category, isCreating]);

  const saveServiceMutation = useMutation({
    mutationFn: async () => {
      const serviceData = {
        ...formData,
        is_active: true,
      };

      if (isCreating) {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(isCreating ? 'Service created successfully' : 'Service updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(isCreating ? 'Failed to create service' : 'Failed to update service');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveServiceMutation.mutate();
  };

  const unitTypes = [
    "Standard Units",
    "ADA Units", 
    "Luxury Units",
    "Hand Wash Stations",
    "Portable Sinks"
  ];

  const assetTypes = [
    "Pump Trucks",
    "Service Vehicles",
    "Cleaning Equipment"
  ];

  // Category options with prefixes
  const categoryOptions = [
    { value: 'cleaning', label: 'Cleaning', prefix: 'CL' },
    { value: 'preventive_maintenance', label: 'Preventive Maintenance', prefix: 'PM' },
    { value: 'corrective_maintenance', label: 'Corrective Maintenance', prefix: 'CM' },
    { value: 'inspection', label: 'Inspection', prefix: 'IN' },
    { value: 'emergency_response', label: 'Emergency Response', prefix: 'EM' },
    { value: 'contractor_work', label: 'Contractor Work', prefix: 'CO' },
    { value: 'restock', label: 'Restock', prefix: 'RS' },
    { value: 'service_request', label: 'Service Request', prefix: 'SR' },
    { value: 'breakdown_repair', label: 'Breakdown Repair', prefix: 'BD' },
    { value: 'testing_calibration', label: 'Testing & Calibration', prefix: 'TC' },
    { value: 'deodorizing', label: 'Deodorizing', prefix: 'DP' },
    { value: 'sanitization', label: 'Sanitization', prefix: 'SN' },
    { value: 'quality_assurance', label: 'Quality Assurance', prefix: 'QA' },
    { value: 'other', label: 'Other', prefix: 'OT' },
  ] as const;

  const getPrefixForCategory = (cat: string) => categoryOptions.find(c => c.value === cat)?.prefix || 'OT';

  const generateNextServiceCode = async (categoryValue: string) => {
    const prefix = getPrefixForCategory(categoryValue);
    if (!prefix) return;

    const { data, error } = await supabase
      .from('services')
      .select('code')
      .ilike('code', `${prefix}-%`);

    if (error) {
      console.error('Error fetching codes', error);
      return;
    }

    let maxNum = 0;
    (data || []).forEach((row: any) => {
      const m = row.code?.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) maxNum = Math.max(maxNum, n);
      }
    });

    const next = (maxNum + 1).toString().padStart(4, '0');
    setFormData(prev => ({ ...prev, code: `${prefix}-${next}` }));
  };

  const toggleTarget = (target: string) => {
    setFormData(prev => ({
      ...prev,
      eligible_targets: prev.eligible_targets.includes(target)
        ? prev.eligible_targets.filter(t => t !== target)
        : [...prev.eligible_targets, target]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Add New Service' : 'Edit Service'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Service Code *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  required
                  disabled={!isCreating}
                  placeholder="Will auto-generate (e.g., CL-0001)"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Generate code"
                  onClick={() => generateNextServiceCode(formData.category)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} ({opt.prefix})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pricing_method">Pricing Method</Label>
              <Select
                value={formData.pricing_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_visit">Per Visit</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="included">Included (No Charge)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="default_rate">Default Rate ($)</Label>
              <Input
                id="default_rate"
                type="number"
                step="0.01"
                value={formData.default_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, default_rate: parseFloat(e.target.value) || 0 }))}
                disabled={formData.pricing_method === 'included'}
              />
            </div>

            <div>
              <Label htmlFor="estimated_duration">Duration (minutes)</Label>
              <Input
                id="estimated_duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Template */}
          <div>
            <Label htmlFor="template">Default Report Template</Label>
            <Select
              value={formData.default_template_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, default_template_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.template_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evidence Requirements */}
          <div>
            <Label className="text-base font-medium">Evidence Requirements</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="min_photos">Minimum Photos</Label>
                <Input
                  id="min_photos"
                  type="number"
                  min="0"
                  value={formData.evidence_requirements.min_photos}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    evidence_requirements: {
                      ...prev.evidence_requirements,
                      min_photos: parseInt(e.target.value) || 0
                    }
                  }))}
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="gps_required"
                  checked={formData.evidence_requirements.gps_required}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    evidence_requirements: {
                      ...prev.evidence_requirements,
                      gps_required: !!checked
                    }
                  }))}
                />
                <Label htmlFor="gps_required">GPS Required</Label>
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="signature_required"
                  checked={formData.evidence_requirements.signature_required}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    evidence_requirements: {
                      ...prev.evidence_requirements,
                      signature_required: !!checked
                    }
                  }))}
                />
                <Label htmlFor="signature_required">Signature Required</Label>
              </div>
            </div>
          </div>

          {/* Eligible Targets */}
          <div>
            <Label className="text-base font-medium">Applies To</Label>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Unit Types</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {unitTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.eligible_targets.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTarget(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Fleet Assets</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {assetTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.eligible_targets.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTarget(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="can_be_recurring"
              checked={formData.can_be_recurring}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_be_recurring: !!checked }))}
            />
            <Label htmlFor="can_be_recurring">Can be recurring</Label>
          </div>

          {/* Microcopy */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Services define <em>what you do</em>. Records are created when a job or work order using this service is completed.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveServiceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveServiceMutation.isPending 
                ? (isCreating ? "Creating..." : "Updating...") 
                : (isCreating ? "Create Service" : "Update Service")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};