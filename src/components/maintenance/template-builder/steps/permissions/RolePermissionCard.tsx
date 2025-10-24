import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface RolePermissionCardProps {
  role: 'tech' | 'office' | 'admin';
  permissions: {
    label: string;
    value: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
  }[];
}

const roleConfig = {
  tech: {
    title: 'Technician',
    badge: 'Field User',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    textColor: 'text-white',
  },
  office: {
    title: 'Office Staff',
    badge: 'Dispatcher',
    color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    textColor: 'text-white',
  },
  admin: {
    title: 'Admin',
    badge: 'Manager',
    color: 'bg-gradient-to-r from-orange-500 to-orange-600',
    textColor: 'text-white',
  },
};

export function RolePermissionCard({ role, permissions }: RolePermissionCardProps) {
  const config = roleConfig[role];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Badge className={`${config.color} ${config.textColor} font-bold`}>
          {config.badge}
        </Badge>
        <h3 className="font-semibold text-lg">{config.title}</h3>
      </div>

      <div className="space-y-3">
        {permissions.map((perm, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`${role}-${index}`}
              checked={perm.value}
              onCheckedChange={perm.onChange}
              disabled={perm.disabled}
            />
            <Label
              htmlFor={`${role}-${index}`}
              className={`text-sm ${perm.disabled ? 'text-muted-foreground' : 'cursor-pointer'}`}
            >
              {perm.label}
            </Label>
          </div>
        ))}
      </div>
    </Card>
  );
}
