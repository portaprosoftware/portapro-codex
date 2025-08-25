import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerNotesTabProps {
  customerId: string;
}

export function CustomerNotesTab({ customerId }: CustomerNotesTabProps) {
  return (
    <div className="space-y-6">
      {/* Notes Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Customer Notes</h3>
        <Button
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-md border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Sample Notes - placeholder for now */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            General Notes
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No notes have been added for this customer yet.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Service Notes
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No service notes have been added for this customer yet.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Communication Log
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No communication logs have been recorded for this customer yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}