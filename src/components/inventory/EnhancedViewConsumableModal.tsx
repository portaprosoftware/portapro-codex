import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { useConsumableAnalytics } from '@/hooks/useConsumableAnalytics';
import { 
  Package, 
  MapPin, 
  DollarSign, 
  AlertTriangle, 
  Tag, 
  FileText, 
  Barcode,
  Factory,
  Shield,
  TrendingUp,
  Download,
  Eye,
  Calendar,
  Calculator,
  Truck
} from 'lucide-react';

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
  notes?: string;
  base_unit: string;
  supplier_info: any;
  location_stock: LocationStockItem[];
  created_at: string;
  updated_at: string;
  // New fields from Phase 2
  mpn?: string;
  model_number?: string;
  gtin_barcode?: string;
  supplier_item_id?: string;
  brand?: string;
  case_quantity?: number;
  fragrance_color_grade?: string;
  dilution_ratio?: string;
  sds_link?: string;
  ghs_hazard_flags: string[];
  expiration_date?: string;
  lot_batch_number?: string;
  case_cost?: number;
  cost_per_use?: number;
  billable_rule?: string;
  target_days_supply: number;
  lead_time_days: number;
}

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
  lowStockThreshold?: number;
}

interface EnhancedViewConsumableModalProps {
  consumable: Consumable | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedViewConsumableModal: React.FC<EnhancedViewConsumableModalProps> = ({
  consumable,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: analytics, isLoading: analyticsLoading } = useConsumableAnalytics(consumable?.id || '', consumable);

  if (!consumable) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStockStatus = () => {
    if (consumable.on_hand_qty <= 0) return { 
      label: 'Out of Stock', 
      className: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-semibold'
    };
    if (consumable.on_hand_qty <= consumable.reorder_threshold) return { 
      label: 'Low Stock', 
      className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold'
    };
    return { 
      label: 'In Stock', 
      className: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-semibold'
    };
  };

  const stockStatus = getStockStatus();

  const getComplianceStatus = () => {
    const hasHazards = consumable.ghs_hazard_flags && consumable.ghs_hazard_flags.length > 0;
    const hasSDS = consumable.sds_link;
    
    if (hasHazards && !hasSDS) return { label: 'SDS Required', variant: 'destructive' as const };
    if (hasHazards && hasSDS) return { label: 'Compliant', variant: 'default' as const };
    return { label: 'Non-Hazardous', variant: 'secondary' as const };
  };

  const complianceStatus = getComplianceStatus();

  const calculateDaysOfSupply = () => {
    if (!analytics) return 0;
    return analytics.daysOfSupply;
  };

  const calculateReorderPoint = () => {
    if (!analytics) return 0;
    return analytics.reorderPoint;
  };

  const handleSDSView = () => {
    if (consumable.sds_link) {
      window.open(consumable.sds_link, '_blank');
    }
  };

  const handleSDSDownload = () => {
    if (consumable.sds_link) {
      const link = document.createElement('a');
      link.href = consumable.sds_link;
      link.download = `SDS_${consumable.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Package className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {consumable.name}
                <Badge className={stockStatus.className}>{stockStatus.label}</Badge>
              </div>
              {consumable.brand && (
                <p className="text-sm text-muted-foreground font-normal">by {consumable.brand}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5 shrink-0">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="identifiers" className="flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              Identifiers
            </TabsTrigger>
            <TabsTrigger value="packaging" className="flex items-center gap-2">
              <Factory className="w-4 h-4" />
              Packaging
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 min-h-0">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="w-4 h-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-base font-medium">{consumable.name}</p>
                    </div>

                    {consumable.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm">{consumable.description}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <p className="text-sm">{formatCategoryDisplay(consumable.category)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Base Unit</label>
                      <p className="text-sm">{consumable.base_unit}</p>
                    </div>

                    {consumable.billable_rule && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Billing Rule</label>
                        <p className="text-sm">{consumable.billable_rule}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cost Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="w-4 h-4" />
                      Cost Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                        <p className="text-base font-medium">{formatCurrency(consumable.unit_cost)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                        <p className="text-base font-medium">{formatCurrency(consumable.unit_price)}</p>
                      </div>
                    </div>

                    {consumable.case_cost && consumable.case_quantity && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Case Cost</label>
                          <p className="text-base">{formatCurrency(consumable.case_cost)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Cost per Unit (Case)</label>
                          <p className="text-base">{formatCurrency(consumable.case_cost / consumable.case_quantity)}</p>
                        </div>
                      </div>
                    )}

                    {consumable.cost_per_use && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Cost per Use</label>
                        <p className="text-base">{formatCurrency(consumable.cost_per_use)}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Profit Margin</label>
                      <p className="text-base font-medium">
                        {consumable.unit_cost > 0 
                          ? `${(((consumable.unit_price - consumable.unit_cost) / consumable.unit_cost) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Inventory Value</label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(consumable.on_hand_qty * consumable.unit_cost)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="w-4 h-4" />
                      Inventory Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">On Hand</label>
                        <p className="text-2xl font-bold">{consumable.on_hand_qty}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Reorder Point</label>
                        <p className="text-xl">{consumable.reorder_threshold}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Days of Supply</label>
                        <p className="text-lg font-medium">{calculateDaysOfSupply()} days</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Target Days</label>
                        <p className="text-lg">{consumable.target_days_supply} days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Stock */}
                {consumable.location_stock && consumable.location_stock.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="w-4 h-4" />
                        Location Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {consumable.location_stock.map((location, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{location.locationName}</p>
                              {location.lowStockThreshold && (
                                <p className="text-xs text-muted-foreground">Alert at {location.lowStockThreshold}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{location.quantity}</p>
                              {location.lowStockThreshold && location.quantity <= location.lowStockThreshold && (
                                <Badge variant="secondary" className="text-xs">Low</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="identifiers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Barcode className="w-4 h-4" />
                      Product Identifiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {consumable.sku || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Manufacturer Part Number</label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {consumable.mpn || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">GTIN/Barcode</label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {consumable.gtin_barcode || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Supplier Item ID</label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {consumable.supplier_item_id || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>

                    {consumable.model_number && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Model Number</label>
                        <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{consumable.model_number}</p>
                      </div>
                    )}

                    {consumable.brand && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Brand</label>
                        <p className="text-sm">{consumable.brand}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {consumable.supplier_info && Object.keys(consumable.supplier_info).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="w-4 h-4" />
                        Supplier Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm bg-muted p-3 rounded-lg">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {JSON.stringify(consumable.supplier_info, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="packaging" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Factory className="w-4 h-4" />
                      Packaging Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Case Quantity</label>
                      <p className="text-base">
                        {consumable.case_quantity 
                          ? `${consumable.case_quantity} units per case`
                          : <span className="text-muted-foreground italic">Not specified</span>
                        }
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fragrance/Color/Grade</label>
                      <p className="text-base">
                        {consumable.fragrance_color_grade || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dilution Ratio</label>
                      <p className="text-base">
                        {consumable.dilution_ratio || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="w-4 h-4" />
                      Batch Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lot/Batch Number</label>
                      <p className="text-base font-mono">
                        {consumable.lot_batch_number || <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expiration Date</label>
                      <p className="text-base">
                        {consumable.expiration_date 
                          ? formatDate(consumable.expiration_date)
                          : <span className="text-muted-foreground italic">Not specified</span>
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="w-4 h-4" />
                      Safety & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Compliance Status</label>
                      <Badge variant={complianceStatus.variant}>{complianceStatus.label}</Badge>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">GHS Hazard Classifications</label>
                      {consumable.ghs_hazard_flags && consumable.ghs_hazard_flags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {consumable.ghs_hazard_flags.map((flag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-1">No hazard classifications</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Safety Data Sheet</label>
                      {consumable.sds_link ? (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={handleSDSView}>
                            <Eye className="w-4 h-4 mr-2" />
                            View SDS
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleSDSDownload}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" disabled>
                            <Eye className="w-4 h-4 mr-2" />
                            View SDS
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <p className="text-xs text-muted-foreground ml-2 self-center">No SDS document available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {consumable.notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                        <p className="text-sm bg-muted p-3 rounded-lg">{consumable.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="text-sm">{formatDate(consumable.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                        <p className="text-sm">{formatDate(consumable.updated_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="w-4 h-4" />
                      Inventory Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Current Days Supply</label>
                        <p className="text-2xl font-bold">{calculateDaysOfSupply()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Target Days Supply</label>
                        <p className="text-xl">{consumable.target_days_supply}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Lead Time</label>
                        <p className="text-lg">{consumable.lead_time_days} days</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Calculated Reorder Point</label>
                        <p className="text-lg">{calculateReorderPoint()}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                      <div className="mt-2">
                        <Badge className={stockStatus.className}>{stockStatus.label}</Badge>
                        {analytics && !analytics.hasRealData && (
                          <p className="text-xs text-muted-foreground mt-1">* Based on estimated usage</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="w-4 h-4" />
                      Usage Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analyticsLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Loading usage metrics...</p>
                      </div>
                    ) : analytics ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            {analytics.hasRealData ? 'Actual Daily Usage' : 'Estimated Daily Usage'}
                          </label>
                          <p className="text-lg">{analytics.dailyUsageRate.toFixed(2)} units/day</p>
                          {!analytics.hasRealData && (
                            <p className="text-xs text-muted-foreground">Based on target days supply</p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Monthly Consumption Value</label>
                          <p className="text-lg font-medium">
                            {formatCurrency(analytics.monthlyConsumptionValue)}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Turnover Rate</label>
                          <p className="text-lg">{analytics.turnoverRate.toFixed(1)}x per year</p>
                        </div>

                        {analytics.hasRealData && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-green-600 font-medium">✓ Based on actual consumption data (90 days)</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Unable to load usage metrics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};