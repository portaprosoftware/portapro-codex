import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { FileText, Search, Calendar, Clock, CheckCircle, AlertCircle, Download, Eye, ExternalLink, BarChart3, TrendingUp, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateSafe } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface ServiceReport {
  id: string;
  report_number: string;
  template_name: string;
  completion_date: string;
  status: 'submitted' | 'pending_signature' | 'completed' | 'draft';
  created_at: string;
  job_id: string;
  customer_id: string;
  pdf_url?: string;
  jobs: {
    job_number: string;
    customers: {
      name: string;
    } | null;
  } | null;
}

export const DriverReportsPage: React.FC = () => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: serviceReports, isLoading, refetch } = useQuery({
    queryKey: ['driver-service-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Query maintenance reports that were created by this driver
      const { data, error } = await supabase
        .from('maintenance_reports')
        .select(`
          *,
          jobs!inner (
            job_number,
            driver_id,
            customers (
              name
            )
          )
        `)
        .eq('jobs.driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to match ServiceReport interface
      return data?.map(report => ({
        id: report.id,
        report_number: report.report_number,
        template_name: 'Service Report',
        completion_date: report.completed_at || report.created_at,
        status: report.completion_percentage === 100 ? 'completed' : 
                report.completion_percentage > 0 ? 'submitted' : 'draft',
        created_at: report.created_at,
        job_id: report.job_id,
        customer_id: report.customer_id,
        pdf_url: undefined, // PDF functionality will be added when URLs are available
        jobs: report.jobs
      })) as ServiceReport[] || [];
    },
    enabled: !!user?.id
  });

  const filteredReports = serviceReports?.filter(report => {
    const matchesSearch = !searchQuery || 
      report.template_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.jobs?.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Performance Analytics
  const completedReports = filteredReports.filter(r => r.status === 'completed').length;
  const totalReports = filteredReports.length;
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  const thisMonthReports = filteredReports.filter(r => 
    new Date(r.created_at).getMonth() === new Date().getMonth()
  ).length;

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { variant: 'success' as const, icon: CheckCircle, label: 'Completed' },
      submitted: { variant: 'info' as const, icon: Clock, label: 'Submitted' },
      pending_signature: { variant: 'warning' as const, icon: AlertCircle, label: 'Pending Signature' },
      draft: { variant: 'secondary' as const, icon: FileText, label: 'Draft' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-white">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleViewPDF = (report: ServiceReport) => {
    if (report.pdf_url) {
      setSelectedReport(report);
      setShowPDFModal(true);
    } else {
      toast.error('PDF not available for this report');
    }
  };

  const handleDownloadPDF = (report: ServiceReport) => {
    if (report.pdf_url) {
      const link = document.createElement('a');
      link.href = report.pdf_url;
      link.download = `${report.report_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF download started');
    } else {
      toast.error('PDF not available for download');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Service Reports</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Analytics Cards */}
        {showAnalytics && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Total Reports</p>
                  <p className="text-lg font-semibold text-blue-600">{totalReports}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-semibold text-green-600">{completedReports}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Completion Rate</p>
                  <p className="text-lg font-semibold text-purple-600">{completionRate}%</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">This Month</p>
                  <p className="text-lg font-semibold text-orange-600">{thisMonthReports}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search reports, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="pending_signature">Pending Signature</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Service Reports</h3>
            <p className="text-center">
              {searchQuery || statusFilter !== 'all' 
                ? 'No reports match your current filters'
                : "You haven't completed any service reports yet"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <Card key={report.id} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {report.report_number}
                        </h3>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {report.template_name}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateSafe(report.completion_date, 'short')}</span>
                        </div>
                        
                        {report.jobs?.customers?.name && (
                          <span className="truncate">
                            {report.jobs.customers.name}
                          </span>
                        )}
                        
                        {report.jobs?.job_number && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {report.jobs.job_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {report.pdf_url && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewPDF(report)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View PDF
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadPDF(report)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {!report.pdf_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        PDF Not Available
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Service Report - {selectedReport?.report_number}</span>
              {selectedReport?.pdf_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(selectedReport.pdf_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {selectedReport?.pdf_url ? (
              <iframe
                src={selectedReport.pdf_url}
                className="w-full h-full border-0 rounded"
                title={`Service Report ${selectedReport.report_number}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>PDF not available for this report</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};