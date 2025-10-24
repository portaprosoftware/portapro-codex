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
                <Badge className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold">Job Data</Badge>
                <span className="text-muted-foreground">
                  Customer name, site address, contact info, PO number, route, tech name, truck ID
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold">Unit List</Badge>
                <span className="text-muted-foreground">
                  All units assigned to the job with their type and last known status
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold">Consumables</Badge>
                <span className="text-muted-foreground">
                  Default blue (oz) and paper rolls per unit type (editable)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">Last Visit</Badge>
                <span className="text-muted-foreground">
                  Previous service data if within 21 days (unit-specific)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold">Signature</Badge>
                <span className="text-muted-foreground">
                  Site contact name pre-filled (if available)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold">Timestamp</Badge>
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
    </div>
  );
};
