import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Tablet, FileText } from 'lucide-react';
import { EnhancedTemplate } from '../types';
import { PhonePreview } from './PhonePreview';
import { TabletPreview } from './TabletPreview';
import { PDFPreview } from './PDFPreview';

interface PreviewPanelProps {
  template: Partial<EnhancedTemplate>;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ template }) => {
  const [activeTab, setActiveTab] = useState('phone');

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span>Live Preview</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({template.sections?.length || 0} sections)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Phone</span>
            </TabsTrigger>
            <TabsTrigger value="tablet" className="flex items-center gap-2">
              <Tablet className="w-4 h-4" />
              <span>Tablet</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phone" className="mt-0">
            <PhonePreview template={template} />
          </TabsContent>

          <TabsContent value="tablet" className="mt-0">
            <TabletPreview template={template} />
          </TabsContent>

          <TabsContent value="pdf" className="mt-0">
            <PDFPreview template={template} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
