import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Permissions } from '../types';

interface PermissionsStepProps {
  permissions: Permissions;
  onPermissionsChange: (permissions: Permissions) => void;
}

export const PermissionsStep: React.FC<PermissionsStepProps> = ({
  permissions,
  onPermissionsChange,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Control who can edit which fields in the field and office
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tech Permissions */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                Tech
              </Badge>
              <h4 className="text-base font-semibold">Technician Permissions</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Techs can edit all fields while in the field by default
            </p>
            <div className="p-3 rounded bg-muted/50">
              <p className="text-sm">✓ All form fields editable</p>
              <p className="text-sm text-muted-foreground mt-1">
                (Custom restrictions coming soon)
              </p>
            </div>
          </div>

          {/* Office Permissions */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                Office
              </Badge>
              <h4 className="text-base font-semibold">Office Permissions</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Office staff can edit all fields plus fees and notes after submission
            </p>
            <div className="p-3 rounded bg-muted/50">
              <p className="text-sm">✓ All form fields editable</p>
              <p className="text-sm">✓ Can adjust fees post-submission</p>
              <p className="text-sm">✓ Can add office notes</p>
            </div>
          </div>

          {/* Internal-Only Fields */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Internal Only</Badge>
              <h4 className="text-base font-semibold">Customer-Facing vs Internal</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Some fields (like GPS coordinates and internal timestamps) won't appear on customer PDFs
            </p>
            <div className="p-3 rounded bg-muted/50">
              <p className="text-sm">🔒 GPS coordinates</p>
              <p className="text-sm">🔒 Internal timestamps</p>
              <p className="text-sm">🔒 Tech notes (if marked internal)</p>
              <p className="text-sm text-muted-foreground mt-2">
                (Customizable in Output step)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
