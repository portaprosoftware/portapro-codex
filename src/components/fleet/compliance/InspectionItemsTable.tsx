import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Package, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TemplateItem {
  id: string;
  item_name: string;
  category?: string;
  required_quantity?: number;
  critical_item?: boolean;
  expiration_trackable?: boolean;
}

interface ItemCondition {
  item_name: string;
  item_category?: string;
  status: 'present' | 'missing' | 'damaged' | 'expired';
  quantity?: number;
  expiration_date?: string;
}

interface InspectionItemsTableProps {
  templateItems: TemplateItem[];
  itemConditions: Record<string, ItemCondition>;
  isEditMode: boolean;
  onItemChange?: (itemId: string, field: keyof ItemCondition, value: any) => void;
}

export function InspectionItemsTable({ 
  templateItems, 
  itemConditions, 
  isEditMode, 
  onItemChange 
}: InspectionItemsTableProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'damaged':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const toTitleCase = (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const variants: Record<string, any> = {
      present: { className: 'bg-gradient-to-r from-green-600 to-green-500 text-white font-bold' },
      missing: { className: 'bg-gradient-to-r from-red-600 to-red-500 text-white font-bold' },
      damaged: { className: 'bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold' },
      expired: { className: 'bg-gradient-to-r from-red-600 to-red-500 text-white font-bold' },
    };
    
    const config = variants[status] || { className: 'bg-gradient-to-r from-gray-600 to-gray-500 text-white font-bold' };
    
    return (
      <Badge {...config}>
        {status ? toTitleCase(status) : 'Not Checked'}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {templateItems.map((item) => {
        const condition = itemConditions[item.id];
        const status = condition?.status || 'not_checked';

        return (
          <div 
            key={item.id} 
            className="p-4 border rounded-lg space-y-3 bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">{getStatusIcon(status)}</div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.item_name}</h4>
                  {item.category && (
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  )}
                  {item.required_quantity && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected Qty: {item.required_quantity}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {isEditMode ? (
                  <Select
                    value={status}
                    onValueChange={(value) => onItemChange?.(item.id, 'status', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  getStatusBadge(status)
                )}
              </div>
            </div>

            {/* Additional fields for edit mode */}
            {isEditMode && condition && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={condition.quantity || ''}
                    onChange={(e) => onItemChange?.(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label className="text-xs">Expiration Date</Label>
                  <Input
                    type="date"
                    value={condition.expiration_date || ''}
                    onChange={(e) => onItemChange?.(item.id, 'expiration_date', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Display expiration in view mode */}
            {!isEditMode && condition?.expiration_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Calendar className="h-4 w-4" />
                <span>Expires: {format(parseISO(condition.expiration_date), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
