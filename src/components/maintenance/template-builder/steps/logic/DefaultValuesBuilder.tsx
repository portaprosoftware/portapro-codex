import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DefaultValueRule } from '../../types';
import { FileText } from 'lucide-react';

interface DefaultValuesBuilderProps {
  rules: DefaultValueRule[];
  onChange: (rules: DefaultValueRule[]) => void;
}

export const DefaultValuesBuilder: React.FC<DefaultValuesBuilderProps> = ({
  rules,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div>
              <h5 className="text-sm font-medium mb-1">Auto-Prefilled Fields</h5>
              <p className="text-xs text-muted-foreground">
                The following fields will be automatically populated when techs open a new report:
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">Job Data</Badge>
                <span className="text-muted-foreground">
                  Customer name, site address, contact info, PO number, route, tech name, truck ID
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">Unit List</Badge>
                <span className="text-muted-foreground">
                  All units assigned to the job with their type and last known status
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">Consumables</Badge>
                <span className="text-muted-foreground">
                  Default blue (oz) and paper rolls per unit type (editable)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">Last Visit</Badge>
                <span className="text-muted-foreground">
                  Previous service data if within 21 days (unit-specific)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">Signature</Badge>
                <span className="text-muted-foreground">
                  Site contact name pre-filled (if available)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">Timestamp</Badge>
                <span className="text-muted-foreground">
                  Current date/time for service start (auto-captured)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground italic">
                💡 Techs can edit any pre-filled value. All defaults work offline using cached data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-dashed bg-muted/20">
        <p className="text-xs text-center text-muted-foreground">
          Advanced default value mapping coming soon
        </p>
      </div>
    </div>
  );
};
