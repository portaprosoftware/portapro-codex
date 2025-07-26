import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  Eye,
  Settings,
  Palette,
  Layout,
  Type
} from 'lucide-react';

interface EnhancedPDFGeneratorProps {
  templateId: string;
  reportData?: any;
  isOpen: boolean;
  onClose: () => void;
}

interface TemplateSection {
  id: string;
  section_type: string;
  position: number;
  settings: any;
  is_active: boolean;
}

interface SectionType {
  id: string;
  name: string;
  display_name: string;
  category: string;
  icon: string;
  description: string;
  default_settings: any;
}

export const EnhancedPDFGenerator: React.FC<EnhancedPDFGeneratorProps> = ({
  templateId,
  reportData,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();

  // Fetch template data
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_report_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId
  });

  // Fetch template sections
  const { data: sections = [] } = useQuery({
    queryKey: ['template-sections', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as TemplateSection[];
    },
    enabled: !!templateId
  });

  // Fetch section types for display names
  const { data: sectionTypes = [] } = useQuery({
    queryKey: ['section-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_types')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as SectionType[];
    }
  });

  // Generate PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: async (options: { format: 'download' | 'email' | 'print' }) => {
      // Enhanced PDF generation with template sections
      const pdfData = {
        template: {
          id: templateId,
          name: template?.name,
          page_size: (template as any)?.page_size || 'letter',
          orientation: (template as any)?.orientation || 'portrait',
          company_logo_url: (template as any)?.company_logo_url,
          color_accent: (template as any)?.color_accent || '#3B82F6'
        },
        sections: sections.map(section => {
          const sectionType = sectionTypes.find(st => st.name === section.section_type);
          return {
            type: section.section_type,
            display_name: sectionType?.display_name || section.section_type,
            position: section.position,
            settings: section.settings,
            data: getSampleDataForSection(section.section_type)
          };
        }),
        reportData: reportData || getSampleReportData(),
        options
      };

      const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
        body: pdfData
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.format === 'download') {
        // Create blob and download
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template?.name || 'report'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'PDF Generated',
        description: `PDF ${variables.format === 'download' ? 'downloaded' : 'processed'} successfully`
      });
    },
    onError: (error) => {
      toast({
        title: 'PDF Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Sample data generators
  const getSampleDataForSection = (sectionType: string) => {
    const sampleData: Record<string, any> = {
      header: {
        company_name: 'ABC Portable Toilet Rentals',
        report_title: 'Maintenance Service Report',
        report_date: new Date().toLocaleDateString(),
        report_number: 'MSR-2024-001'
      },
      customer_info: {
        name: 'John Smith Construction',
        contact: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john@smithconstruction.com',
        address: '123 Main St, Anytown, ST 12345'
      },
      job_details: {
        job_number: 'JOB-2024-001',
        scheduled_date: new Date().toLocaleDateString(),
        technician: 'Mike Johnson',
        job_type: 'Routine Maintenance'
      },
      vehicle_info: {
        license_plate: 'ABC-123',
        vin: '1HGCM82633A004352',
        make_model: '2023 Ford Transit',
        mileage: '15,245'
      },
      service_checklist: {
        items: [
          { task: 'Check toilet paper supply', completed: true },
          { task: 'Empty waste tank', completed: true },
          { task: 'Refill hand sanitizer', completed: true },
          { task: 'Clean exterior', completed: false },
          { task: 'Check door locks', completed: true }
        ]
      },
      parts_used: {
        items: [
          { name: 'Toilet Paper Roll', sku: 'TP-001', quantity: 2, unit_cost: 3.50, total: 7.00 },
          { name: 'Hand Sanitizer', sku: 'HS-001', quantity: 1, unit_cost: 12.99, total: 12.99 },
          { name: 'Cleaning Solution', sku: 'CS-001', quantity: 1, unit_cost: 8.75, total: 8.75 }
        ],
        total_cost: 28.74
      },
      labor_summary: {
        start_time: '09:00 AM',
        end_time: '10:30 AM',
        total_hours: 1.5,
        hourly_rate: 45.00,
        labor_cost: 67.50
      },
      photos: {
        before_photos: ['before1.jpg', 'before2.jpg'],
        after_photos: ['after1.jpg', 'after2.jpg']
      },
      technician_signature: {
        signed_by: 'Mike Johnson',
        signature_date: new Date().toLocaleDateString()
      },
      notes: {
        content: 'Unit was in good condition. Minor cleaning required. Customer satisfied with service.'
      }
    };

    return sampleData[sectionType] || {};
  };

  const getSampleReportData = () => ({
    report_id: 'MSR-2024-001',
    created_date: new Date().toISOString(),
    customer: {
      name: 'John Smith Construction',
      contact: 'John Smith',
      phone: '(555) 123-4567'
    },
    technician: {
      name: 'Mike Johnson',
      id: 'TECH-001'
    },
    job: {
      type: 'Routine Maintenance',
      scheduled_date: new Date().toISOString(),
      location: '123 Main St, Anytown, ST 12345'
    }
  });

  if (templateLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Generate PDF Report</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          {/* Left Panel - Template Info & Options */}
          <div className="col-span-4 flex flex-col space-y-6 overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{template?.name}</h3>
                  <p className="text-sm text-muted-foreground">{template?.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Page Size:</span>
                    <p className="text-muted-foreground">
                      {(template as any)?.page_size || 'Letter'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Orientation:</span>
                    <p className="text-muted-foreground">
                      {(template as any)?.orientation || 'Portrait'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Sections ({sections.length}):</span>
                  <div className="mt-2 space-y-1">
                    {sections.map((section, index) => {
                      const sectionType = sectionTypes.find(st => st.name === section.section_type);
                      return (
                        <div key={section.id} className="flex items-center justify-between text-sm">
                          <span>{index + 1}. {sectionType?.display_name || section.section_type}</span>
                          <Badge variant="outline" className="text-xs">
                            {sectionType?.category || 'General'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => generatePDFMutation.mutate({ format: 'download' })}
                    disabled={generatePDFMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => generatePDFMutation.mutate({ format: 'print' })}
                    disabled={generatePDFMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => generatePDFMutation.mutate({ format: 'email' })}
                    disabled={generatePDFMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email to Customer
                  </Button>
                </div>

                {generatePDFMutation.isPending && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Generating PDF...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="col-span-8 flex flex-col overflow-hidden">
            <Card className="flex-1 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>PDF Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <ScrollArea className="h-full">
                  <div 
                    className="bg-white border rounded-lg p-8 shadow-sm mx-auto"
                    style={{ 
                      width: (template as any)?.orientation === 'landscape' ? '11in' : '8.5in',
                      minHeight: (template as any)?.orientation === 'landscape' ? '8.5in' : '11in',
                      transform: 'scale(0.6)',
                      transformOrigin: 'top center'
                    }}
                  >
                    {/* PDF Content Preview */}
                    <div className="space-y-6">
                      {sections.map((section) => {
                        const sectionType = sectionTypes.find(st => st.name === section.section_type);
                        const sampleData = getSampleDataForSection(section.section_type);
                        
                        return (
                          <div key={section.id} className="space-y-2">
                            <h3 
                              className="font-semibold text-lg border-b pb-1"
                              style={{ color: (template as any)?.color_accent || '#3B82F6' }}
                            >
                              {sectionType?.display_name || section.section_type}
                            </h3>
                            
                            {renderSectionPreview(section.section_type, sampleData, section.settings)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  function renderSectionPreview(sectionType: string, data: any, settings: any) {
    switch (sectionType) {
      case 'header':
        return (
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{data.company_name}</h1>
            <h2 className="text-xl">{data.report_title}</h2>
            <div className="flex justify-between text-sm">
              <span>Report #: {data.report_number}</span>
              <span>Date: {data.report_date}</span>
            </div>
          </div>
        );

      case 'customer_info':
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Customer:</strong> {data.name}</p>
              <p><strong>Contact:</strong> {data.contact}</p>
            </div>
            <div>
              <p><strong>Phone:</strong> {data.phone}</p>
              <p><strong>Email:</strong> {data.email}</p>
            </div>
            <div className="col-span-2">
              <p><strong>Address:</strong> {data.address}</p>
            </div>
          </div>
        );

      case 'service_checklist':
        return (
          <div className="space-y-2">
            {data.items?.map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={item.completed} readOnly className="h-4 w-4" />
                <span className={item.completed ? 'line-through text-gray-500' : ''}>
                  {item.task}
                </span>
              </div>
            ))}
          </div>
        );

      case 'parts_used':
        return (
          <div className="space-y-2">
            <table className="w-full text-sm border-collapse border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Part</th>
                  <th className="border p-2 text-left">SKU</th>
                  <th className="border p-2 text-right">Qty</th>
                  <th className="border p-2 text-right">Unit Cost</th>
                  <th className="border p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">{item.sku}</td>
                    <td className="border p-2 text-right">{item.quantity}</td>
                    <td className="border p-2 text-right">${item.unit_cost.toFixed(2)}</td>
                    <td className="border p-2 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="border p-2 text-right">Total:</td>
                  <td className="border p-2 text-right">${data.total_cost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'notes':
        return (
          <div className="text-sm">
            <p>{data.content}</p>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            {sectionType} section preview
          </div>
        );
    }
  }
};