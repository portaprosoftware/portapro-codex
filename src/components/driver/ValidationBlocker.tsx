import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ValidationError {
  message: string;
  unitIndex?: number;
  unitId?: string;
  fieldId?: string;
}

interface ValidationBlockerProps {
  errors: ValidationError[];
  warnings: string[];
  onJumpToUnit?: (unitIndex: number) => void;
  onJumpToField?: (fieldId: string) => void;
}

export const ValidationBlocker: React.FC<ValidationBlockerProps> = ({
  errors,
  warnings,
  onJumpToUnit,
  onJumpToField,
}) => {
  const unitErrors = errors.filter(e => e.unitIndex !== undefined);
  const generalErrors = errors.filter(e => e.unitIndex === undefined);

  const errorsByUnit = unitErrors.reduce((acc, error) => {
    const key = error.unitIndex!;
    if (!acc[key]) acc[key] = [];
    acc[key].push(error);
    return acc;
  }, {} as Record<number, ValidationError[]>);

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-lg text-red-600">
              Cannot Submit Report
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Please resolve the following issues before submitting
            </p>
          </div>
          <Badge variant="destructive" className="font-bold">
            {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {/* General Errors */}
            {generalErrors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">General Issues</h4>
                {generalErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded border border-red-200 bg-red-50 dark:bg-red-950/20"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-sm flex-1">{error.message}</span>
                    {error.fieldId && onJumpToField && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onJumpToField(error.fieldId!)}
                        className="h-auto py-1 px-2 text-xs"
                      >
                        Fix <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Unit-Specific Errors */}
            {Object.keys(errorsByUnit).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Unit-Specific Issues</h4>
                {Object.entries(errorsByUnit).map(([unitIndexStr, unitErrors]) => {
                  const unitIndex = parseInt(unitIndexStr);
                  return (
                    <div
                      key={unitIndex}
                      className="rounded border border-red-200 bg-red-50 dark:bg-red-950/20 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-950/40">
                        <span className="text-sm font-medium">
                          Unit {unitIndex + 1}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {unitErrors.length}
                        </Badge>
                      </div>
                      <div className="p-2 space-y-1">
                        {unitErrors.map((error, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-red-600">•</span>
                            <span className="flex-1">{error.message}</span>
                          </div>
                        ))}
                        {onJumpToUnit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onJumpToUnit(unitIndex)}
                            className="w-full mt-2 text-xs h-8"
                          >
                            Jump to Unit {unitIndex + 1}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-600">Warnings</h4>
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded border border-orange-200 bg-orange-50 dark:bg-orange-950/20"
                  >
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
