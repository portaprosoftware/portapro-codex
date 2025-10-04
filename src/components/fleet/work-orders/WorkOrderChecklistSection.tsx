import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Camera, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ChecklistItem {
  id: string;
  item_name: string;
  category: string;
  status: 'pass' | 'fail' | 'na' | 'in_progress';
  severity?: 'minor' | 'major' | 'critical';
  notes?: string;
  photos?: string[];
}

interface WorkOrderChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  templateChecklist?: Array<{ item: string; category: string }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Engine": "🔧",
  "Vacuum System": "🌀",
  "Brakes": "🛑",
  "Electrical": "⚡",
  "Body/Chassis": "🚛",
  "Hoses & Valves": "🔗",
  "Fresh Water": "💧",
  "Pressure Washer": "💦"
};

export const WorkOrderChecklistSection: React.FC<WorkOrderChecklistSectionProps> = ({
  items,
  onChange,
  templateChecklist
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'na': return <MinusCircle className="h-4 w-4 text-gray-400" />;
      default: return null;
    }
  };

  const getCategoryStats = (category: string) => {
    const categoryItems = groupedItems[category] || [];
    const pass = categoryItems.filter(i => i.status === 'pass').length;
    const fail = categoryItems.filter(i => i.status === 'fail').length;
    const total = categoryItems.length;
    return { pass, fail, total };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Inspection Checklist</CardTitle>
        <p className="text-xs text-muted-foreground">
          Check each item and mark as Pass, Fail, or N/A
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const stats = getCategoryStats(category);
          const isExpanded = expandedCategories.has(category);
          
          return (
            <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="text-lg mr-1">{CATEGORY_ICONS[category] || "📋"}</span>
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.fail > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {stats.fail} fail
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {stats.pass}/{stats.total}
                    </Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-2 space-y-3">
                {categoryItems.map((item) => (
                  <div key={item.id} className="pl-6 pr-3 py-3 border rounded-lg bg-background">
                    <div className="space-y-3">
                      {/* Item name and status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-medium">{item.item_name}</span>
                        </div>
                        {item.status === 'fail' && item.severity && (
                          <Badge 
                            variant={item.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {item.severity}
                          </Badge>
                        )}
                      </div>

                      {/* Status radio group */}
                      <RadioGroup 
                        value={item.status} 
                        onValueChange={(value) => updateItem(item.id, { status: value as any })}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="pass" id={`${item.id}-pass`} />
                          <Label htmlFor={`${item.id}-pass`} className="text-sm cursor-pointer">
                            Pass
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="fail" id={`${item.id}-fail`} />
                          <Label htmlFor={`${item.id}-fail`} className="text-sm cursor-pointer">
                            Fail
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="na" id={`${item.id}-na`} />
                          <Label htmlFor={`${item.id}-na`} className="text-sm cursor-pointer">
                            N/A
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Severity (only show if failed) */}
                      {item.status === 'fail' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Severity</Label>
                          <RadioGroup 
                            value={item.severity || 'minor'} 
                            onValueChange={(value) => updateItem(item.id, { severity: value as any })}
                            className="flex gap-3"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="minor" id={`${item.id}-minor`} />
                              <Label htmlFor={`${item.id}-minor`} className="text-xs cursor-pointer">
                                Minor
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="major" id={`${item.id}-major`} />
                              <Label htmlFor={`${item.id}-major`} className="text-xs cursor-pointer">
                                Major
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="critical" id={`${item.id}-critical`} />
                              <Label htmlFor={`${item.id}-critical`} className="text-xs cursor-pointer text-red-600">
                                Critical
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="space-y-1">
                        <Label htmlFor={`${item.id}-notes`} className="text-xs">
                          Notes (optional)
                        </Label>
                        <Textarea
                          id={`${item.id}-notes`}
                          value={item.notes || ''}
                          onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                          placeholder="Add notes about this item..."
                          className="text-sm min-h-[60px]"
                        />
                      </div>

                      {/* Photo upload */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        type="button"
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        Add Photo
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
