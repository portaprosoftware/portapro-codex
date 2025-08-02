import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { FilterData } from '@/hooks/useFilterPresets';

interface Job {
  id: string;
  job_number: string;
  scheduled_date: string;
  job_type: string;
  status: string;
  was_overdue?: boolean;
  completed_at?: string;
  driver_id?: string;
  customers?: {
    id: string;
    name: string;
    service_street?: string;
    service_city?: string;
    service_state?: string;
    service_zip?: string;
  };
  profiles?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
  vehicles?: {
    id: string;
    license_plate?: string;
    vehicle_type?: string;
  };
  customer_service_locations?: {
    gps_coordinates?: { x: number; y: number };
  };
}

interface EnhancedPDFExportProps {
  jobs: Job[];
  totalCount: number;
  filterData: FilterData;
  drivers?: any[];
  className?: string;
}

export const EnhancedPDFExport: React.FC<EnhancedPDFExportProps> = ({
  jobs,
  totalCount,
  filterData,
  drivers = [],
  className
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';
  };

  const handleEnhancedPDFExport = async () => {
    if (jobs.length === 0) {
      toast({
        title: 'No Data',
        description: 'No jobs available for export.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare filter context with enhanced data
      const filterContext = {
        ...filterData,
        driverName: filterData.selectedDriver && filterData.selectedDriver !== 'all' 
          ? getDriverName(filterData.selectedDriver)
          : undefined,
        runBy: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Unknown User',
        presetName: undefined, // Will be set if using a saved preset
      };

      console.log('Calling enhanced PDF generation with context:', filterContext);

      // Call the enhanced PDF generation edge function
      const { data, error } = await supabase.functions.invoke('generate-enhanced-pdf', {
        body: {
          jobs,
          filterContext,
          totalCount,
          userEmail: user?.primaryEmailAddress?.emailAddress
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate PDF');
      }

      console.log('Enhanced PDF generated successfully:', data.metadata);

      // Check if we received PDF data or HTML
      if (data.pdfUrl) {
        // PDF was generated successfully - trigger download
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        
        const timestamp = new Date().toISOString().split('T')[0];
        const presetName = filterContext.presetName ? `-${filterContext.presetName.replace(/\s+/g, '-')}` : '';
        const fileName = `jobs-report${presetName}-${timestamp}.pdf`;
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (data.htmlContent) {
        // Fallback to HTML if PDF generation failed
        const htmlBlob = new Blob([data.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(htmlBlob);
        
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `jobs-report-${timestamp}.html`;
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Enhanced PDF Generated',
        description: `Report generated with ${data.metadata.jobCount} jobs${data.metadata.hasMap ? ' and location map' : ''}.`,
      });

    } catch (error) {
      console.error('Enhanced PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Unable to generate enhanced PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleEnhancedPDFExport}
      disabled={jobs.length === 0 || isGenerating}
      variant="outline"
      size="sm"
      className={className}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isGenerating ? 'Generating...' : `Enhanced PDF (${jobs.length})`}
    </Button>
  );
};