import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CategorySelect } from '@/components/ui/category-select';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner';
import { DesktopBarcodeInput } from '@/components/ui/desktop-barcode-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleLocationStockManager } from './SimpleLocationStockManager';

interface EnhancedAddConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
}

interface ConsumableFormData {
  // Basic Info
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  examples?: string;
  notes?: string;
  
  // Identifiers
  sku?: string;
  mpn?: string;
  model_number?: string;
  gtin_barcode?: string;
  supplier_item_id?: string;
  brand?: string;
  
  // Packaging
  base_unit: string;
  case_quantity?: string;
  fragrance_color_grade?: string;
  dilution_ratio?: string;
  
  // Costing
  unit_cost: string;
  unit_price: string;
  case_cost?: string;
  cost_per_use?: string;
  billable_rule?: string;
  
  // Inventory Management
  lead_time_days: string;
  target_days_supply: string;
  reorder_threshold: string;
  
  // Compliance
  sds_link?: string;
  ghs_hazard_flags: string[];
  expiration_date?: Date;
  lot_batch_number?: string;
  
  // Location Stock
  location_stock: LocationStockItem[];
  assumed_use_per_service?: string;
}

const GHS_HAZARD_OPTIONS = [
  'Explosive', 'Flammable', 'Oxidizing', 'Compressed Gas', 
  'Corrosive', 'Toxic', 'Harmful', 'Health Hazard', 
  'Environmental Hazard'
];

const BILLABLE_RULE_OPTIONS = [
  'included_in_service', 'bill_separately', 'customer_supplies'
];

export const EnhancedAddConsumableModal: React.FC<EnhancedAddConsumableModalProps> = ({
  isOpen,
  onClose
}) => {
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [sdsFile, setSdsFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  
  const form = useForm<ConsumableFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      sku: '',
      mpn: '',
      model_number: '',
      gtin_barcode: '',
      supplier_item_id: '',
      brand: '',
      unit_cost: '',
      unit_price: '',
      case_cost: '',
      cost_per_use: '',
      billable_rule: 'included_in_service',
      lead_time_days: '7',
      target_days_supply: '14',
      reorder_threshold: '5',
      base_unit: 'case',
      case_quantity: '',
      fragrance_color_grade: '',
      dilution_ratio: '',
      sds_link: '',
      ghs_hazard_flags: [],
      lot_batch_number: '',
      assumed_use_per_service: '',
      location_stock: [],
      is_active: true,
      examples: '',
      notes: ''
    }
  });

  const createConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      // Parse and validate cost/price
      const unitCost = parseFloat(data.unit_cost);
      const unitPrice = parseFloat(data.unit_price);
      
      if (isNaN(unitCost) || isNaN(unitPrice) || unitCost < 0 || unitPrice < 0) {
        throw new Error('Please enter valid cost and price values');
      }

      // Upload SDS file if provided
      let sdsLink = data.sds_link;
      if (sdsFile) {
        const fileName = `sds_${Date.now()}_${sdsFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, sdsFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path);
        
        sdsLink = urlData.publicUrl;
      }

      // Insert the consumable with all new fields
      const { data: consumableData, error } = await supabase
        .from('consumables')
        .insert({
          // Basic info
          name: data.name,
          description: data.description,
          category: data.category,
          is_active: data.is_active,
          examples: data.examples,
          notes: data.notes,
          
          // Identifiers
          sku: data.sku,
          mpn: data.mpn,
          model_number: data.model_number,
          gtin_barcode: data.gtin_barcode,
          supplier_item_id: data.supplier_item_id,
          brand: data.brand,
          
          // Packaging
          base_unit: data.base_unit,
          case_quantity: data.case_quantity ? parseInt(data.case_quantity) : null,
          fragrance_color_grade: data.fragrance_color_grade,
          dilution_ratio: data.dilution_ratio,
          
          // Costing
          unit_cost: unitCost,
          unit_price: unitPrice,
          case_cost: data.case_cost ? parseFloat(data.case_cost) : null,
          cost_per_use: data.cost_per_use ? parseFloat(data.cost_per_use) : null,
          billable_rule: data.billable_rule,
          
          // Compliance
          sds_link: sdsLink,
          ghs_hazard_flags: data.ghs_hazard_flags || [],
          expiration_date: data.expiration_date ? data.expiration_date.toISOString().split('T')[0] : null,
          lot_batch_number: data.lot_batch_number,
          
          // Inventory Management
          lead_time_days: data.lead_time_days ? parseInt(data.lead_time_days) : 7,
          target_days_supply: data.target_days_supply ? parseInt(data.target_days_supply) : 14,
          reorder_threshold: data.reorder_threshold ? parseInt(data.reorder_threshold) : 0,
          
          // Legacy fields
          location_stock: JSON.stringify(data.location_stock || []) as any,
          supplier_info: JSON.stringify({
            assumed_use_per_service: data.assumed_use_per_service ? parseFloat(data.assumed_use_per_service) : null
          }) as any
        })
        .select()
        .single();
      
      if (error) throw error;
      return consumableData;
    },
    onSuccess: () => {
      toast.success('Consumable created successfully');
      queryClient.invalidateQueries({ queryKey: ['simple-consumables'] });
      queryClient.invalidateQueries({ queryKey: ['simple-consumables-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-velocity-stats'] });
      form.reset();
      setSdsFile(null);
      setActiveTab('basic');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create consumable');
    }
  });

  const handleScanResult = (scannedCode: string) => {
    // Determine if it's a GTIN (12-14 digits) or SKU
    if (/^\d{12,14}$/.test(scannedCode)) {
      form.setValue('gtin_barcode', scannedCode);
      setActiveTab('identifiers');
    } else {
      form.setValue('sku', scannedCode);
    }
    setShowScannerModal(false);
  };

  const handleGhsToggle = (hazard: string) => {
    const current = form.getValues('ghs_hazard_flags') || [];
    if (current.includes(hazard)) {
      form.setValue('ghs_hazard_flags', current.filter(h => h !== hazard));
    } else {
      form.setValue('ghs_hazard_flags', [...current, hazard]);
    }
  };

  const handleSdsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSdsFile(file);
      } else {
        toast.error('Please select a PDF or image file for SDS');
      }
    }
  };

  const onSubmit = (data: ConsumableFormData) => {
    createConsumable.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-2/3 sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Consumable</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="identifiers">Identifiers</TabsTrigger>
                <TabsTrigger value="packaging">Packaging</TabsTrigger>
                <TabsTrigger value="costing">Costing</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter consumable name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    rules={{ required: 'Category is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <CategorySelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select category"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="examples"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Examples</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Hand Soap, Paper Towels" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Provide a detailed description of this consumable"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter additional internal notes"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="location_stock"
                    rules={{ 
                      required: 'At least one storage location is required',
                      validate: (value) => {
                        if (!value || value.length === 0) {
                          return 'At least one storage location is required';
                        }
                        const totalQuantity = value.reduce((sum, item) => sum + (item.quantity || 0), 0);
                        if (totalQuantity <= 0) {
                          return 'Total quantity must be greater than 0';
                        }
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Location Allocation *</FormLabel>
                        <FormControl>
                          <SimpleLocationStockManager
                            value={field.value || []}
                            onChange={field.onChange}
                            disabled={createConsumable.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Identifiers Tab */}
              <TabsContent value="identifiers" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU (Internal)</FormLabel>
                        <FormControl>
                          <DesktopBarcodeInput
                            {...field}
                            placeholder="Enter SKU"
                            onScanResult={handleScanResult}
                            onCameraScan={() => setShowScannerModal(true)}
                            showTestButton={true}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Your internal stock keeping unit code</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter brand name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mpn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MPN (Manufacturer Part Number)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter manufacturer part number" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Official manufacturer identifier</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter model number" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Product model or variant identifier</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gtin_barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GTIN/UPC/EAN Barcode</FormLabel>
                        <FormControl>
                          <DesktopBarcodeInput
                            {...field}
                            placeholder="Enter barcode number"
                            onScanResult={handleScanResult}
                            onCameraScan={() => setShowScannerModal(true)}
                            showTestButton={true}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Global Trade Item Number (12-14 digits)</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier_item_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Item ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter supplier's catalog code" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Vendor's catalog or order code</p>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Packaging Tab */}
              <TabsContent value="packaging" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="base_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Unit</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="case">Case</option>
                            <option value="gallon">Gallon</option>
                            <option value="liter">Liter</option>
                            <option value="box">Box</option>
                            <option value="pack">Pack</option>
                            <option value="roll">Roll</option>
                            <option value="unit">Unit</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="case_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Quantity</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Units per case" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Number of individual units in one case</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fragrance_color_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fragrance/Color/Grade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Lavender, Blue, Premium" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Product variant details</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dilution_ratio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dilution/Mix Ratio</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1:50, 1 oz per gallon" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">For concentrates and chemicals</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assumed_use_per_service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Use per Service</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="e.g., 0.02"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {form.watch('base_unit')}s used per service (for estimating remaining services)
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lead_time_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Time (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            placeholder="7" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Days from order to delivery</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_days_supply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Days Supply</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            placeholder="14" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Desired days of inventory to maintain</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reorder_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Threshold</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            placeholder="5" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Quantity that triggers low stock alerts</p>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Costing Tab */}
              <TabsContent value="costing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit_cost"
                    rules={{ required: 'Unit cost is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per {form.watch('base_unit') || 'Unit'} *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field} 
                            placeholder="0.00" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit_price"
                    rules={{ required: 'Unit price is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per {form.watch('base_unit') || 'Unit'} *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field} 
                            placeholder="0.00" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="case_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Cost (if different)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field} 
                            placeholder="0.00" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Bulk pricing when buying full cases</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost_per_use"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per Use</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field} 
                            placeholder="0.00" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Calculated cost per service application</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billable_rule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Rule</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="included_in_service">Included in Service</option>
                            <option value="bill_separately">Bill Separately</option>
                            <option value="customer_supplies">Customer Supplies</option>
                          </select>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">How this item is charged to customers</p>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lot_batch_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot/Batch Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter lot or batch number" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick expiration date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sds_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SDS Link (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/sds.pdf" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Link to Safety Data Sheet</p>
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>SDS File Upload</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {sdsFile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{sdsFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSdsFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleSdsFileChange}
                          className="hidden"
                          id="sds-upload"
                        />
                        <label htmlFor="sds-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                          Upload SDS File (PDF or Image)
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <FormLabel>GHS Hazard Classifications</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {GHS_HAZARD_OPTIONS.map((hazard) => (
                      <Button
                        key={hazard}
                        type="button"
                        variant={form.watch('ghs_hazard_flags')?.includes(hazard) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleGhsToggle(hazard)}
                        className="text-xs"
                      >
                        {hazard}
                      </Button>
                    ))}
                  </div>
                  {form.watch('ghs_hazard_flags')?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.watch('ghs_hazard_flags').map((hazard) => (
                        <Badge key={hazard} variant="secondary">
                          {hazard}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Select applicable GHS hazard symbols for this product</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createConsumable.isPending}>
                {createConsumable.isPending ? 'Creating...' : 'Create Consumable'}
              </Button>
            </div>
          </form>
        </Form>

        <BarcodeScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScanResult={handleScanResult}
        />
      </SheetContent>
    </Sheet>
  );
};