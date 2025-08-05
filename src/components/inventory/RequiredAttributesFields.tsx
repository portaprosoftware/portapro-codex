import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RequiredAttributesFieldsProps {
  productId: string;
  attributes: Array<{
    id: string;
    attribute_name: string;
    attribute_value: string;
    is_required: boolean;
  }>;
  values: Record<string, string>;
  onChange: (attributeId: string, value: string) => void;
  errors?: Record<string, string>;
}

export const RequiredAttributesFields: React.FC<RequiredAttributesFieldsProps> = ({
  productId,
  attributes,
  values,
  onChange,
  errors = {}
}) => {
  // Group attributes by name to get all possible values
  const attributeGroups = attributes.reduce((acc, attr) => {
    if (!acc[attr.attribute_name]) {
      acc[attr.attribute_name] = {
        name: attr.attribute_name,
        values: [],
        isRequired: false
      };
    }
    acc[attr.attribute_name].values.push(attr.attribute_value);
    if (attr.is_required) {
      acc[attr.attribute_name].isRequired = true;
    }
    return acc;
  }, {} as Record<string, { name: string; values: string[]; isRequired: boolean }>);

  const requiredAttributes = Object.values(attributeGroups).filter(attr => attr.isRequired);

  if (requiredAttributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-gray-900">Required Attributes</h3>
        <Badge variant="destructive" className="text-xs">
          {requiredAttributes.length} required
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredAttributes.map((attribute) => {
          const fieldKey = attribute.name.toLowerCase();
          const hasError = errors[fieldKey];
          
          return (
            <div key={attribute.name} className="space-y-2">
              <Label htmlFor={fieldKey} className="flex items-center gap-1">
                {attribute.name}
                <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={values[fieldKey] || ""} 
                onValueChange={(value) => onChange(fieldKey, value)}
              >
                <SelectTrigger className={hasError ? "border-red-500" : ""}>
                  <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {attribute.values.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasError && (
                <p className="text-sm text-red-500">{hasError}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};