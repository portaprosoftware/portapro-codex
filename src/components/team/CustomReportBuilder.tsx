import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Filter, 
  CalendarIcon,
  PieChart,
  LineChart,
  Save,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportFilter {
  id: string;
  type: 'date' | 'select' | 'multiselect' | 'boolean';
  label: string;
  options?: { value: string; label: string }[];
  value: any;
}

interface ReportConfig {
  name: string;
  description: string;
  dataSource: string;
  chartType: 'bar' | 'line' | 'pie' | 'table';
  filters: ReportFilter[];
  groupBy?: string;
  aggregation?: 'count' | 'sum' | 'avg';
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export function CustomReportBuilder() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    dataSource: '',
    chartType: 'bar',
    filters: [],
    dateRange: { from: undefined, to: undefined }
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const dataSources = [
    { value: 'drivers', label: 'Driver Management' },
    { value: 'compliance', label: 'Compliance Records' },
    { value: 'training', label: 'Training Data' },
    { value: 'equipment', label: 'Equipment Assignments' },
    { value: 'incidents', label: 'Incident Reports' },
    { value: 'maintenance', label: 'Vehicle Maintenance' }
  ];

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'table', label: 'Data Table', icon: Settings }
  ];

  // Fetch available filters based on data source
  const { data: availableFilters = [] } = useQuery({
    queryKey: ['report-filters', reportConfig.dataSource],
    queryFn: async () => {
      if (!reportConfig.dataSource) return [];
      
      const { data, error } = await supabase.functions.invoke('get-report-filters', {
        body: { dataSource: reportConfig.dataSource }
      });
      
      if (error) throw error;
      return data.filters || [];
    },
    enabled: !!reportConfig.dataSource
  });

  const generateReport = async () => {
    if (!reportConfig.name || !reportConfig.dataSource) {
      toast({
        title: "Missing Information",
        description: "Please provide a report name and select a data source.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-report', {
        body: { config: reportConfig }
      });

      if (error) throw error;

      setPreviewData(data.records || []);
      toast({
        title: "Report Generated",
        description: `Generated report with ${data.records?.length || 0} records.`
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReport = async () => {
    try {
      const { error } = await supabase
        .from('custom_reports')
        .insert({
          name: reportConfig.name,
          description: reportConfig.description,
          report_type: 'custom',
          data_source: reportConfig.dataSource,
          chart_type: reportConfig.chartType,
          configuration: JSON.parse(JSON.stringify(reportConfig)),
          filters: JSON.parse(JSON.stringify(reportConfig.filters.reduce((acc, filter) => {
            acc[filter.id] = filter.value;
            return acc;
          }, {} as Record<string, any>)))
        });

      if (error) throw error;

      toast({
        title: "Report Saved",
        description: "Your custom report has been saved successfully."
      });
    } catch (error) {
      console.error('Save report error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportReport = () => {
    if (previewData.length === 0) {
      toast({
        title: "No Data",
        description: "Generate a report first before exporting.",
        variant: "destructive"
      });
      return;
    }

    // Convert to CSV
    const headers = Object.keys(previewData[0]).join(',');
    const rows = previewData.map(record => 
      Object.values(record).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportConfig.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Report has been exported as CSV."
    });
  };

  const addFilter = (filterTemplate: any) => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      type: filterTemplate.type,
      label: filterTemplate.label,
      options: filterTemplate.options,
      value: filterTemplate.type === 'boolean' ? false : ''
    };

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const updateFilter = (filterId: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter =>
        filter.id === filterId ? { ...filter, value } : filter
      )
    }));
  };

  const removeFilter = (filterId: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom Report Builder</h2>
          <p className="text-muted-foreground">
            Create custom reports and analytics dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport} disabled={previewData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={saveReport} disabled={!reportConfig.name}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Configure the basic settings for your custom report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-source">Data Source</Label>
                  <Select 
                    value={reportConfig.dataSource} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, dataSource: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe what this report shows"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Chart Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {chartTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant={reportConfig.chartType === type.value ? "default" : "outline"}
                        onClick={() => setReportConfig(prev => ({ ...prev, chartType: type.value as any }))}
                        className="h-20 flex-col"
                      >
                        <Icon className="h-6 w-6 mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Range (Optional)</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportConfig.dateRange.from ? format(reportConfig.dateRange.from, 'MMM dd, yyyy') : 'From date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reportConfig.dateRange.from}
                        onSelect={(date) => setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportConfig.dateRange.to ? format(reportConfig.dateRange.to, 'MMM dd, yyyy') : 'To date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reportConfig.dateRange.to}
                        onSelect={(date) => setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Filters
              </CardTitle>
              <CardDescription>
                Add filters to customize your report data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportConfig.dataSource && (
                <div className="space-y-3">
                  <Label>Available Filters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableFilters.map((filterTemplate: any) => (
                      <Button
                        key={filterTemplate.id}
                        variant="outline"
                        onClick={() => addFilter(filterTemplate)}
                        disabled={reportConfig.filters.some(f => f.label === filterTemplate.label)}
                        className="justify-start"
                      >
                        {filterTemplate.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {reportConfig.filters.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Active Filters</Label>
                    {reportConfig.filters.map((filter) => (
                      <div key={filter.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">{filter.label}</Label>
                          <div className="mt-1">
                            {filter.type === 'select' && (
                              <Select
                                value={filter.value}
                                onValueChange={(value) => updateFilter(filter.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select value" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filter.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {filter.type === 'boolean' && (
                              <Checkbox
                                checked={filter.value}
                                onCheckedChange={(checked) => updateFilter(filter.id, checked)}
                              />
                            )}
                            {filter.type === 'date' && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filter.value ? format(new Date(filter.value), 'MMM dd, yyyy') : 'Select date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={filter.value ? new Date(filter.value) : undefined}
                                    onSelect={(date) => updateFilter(filter.id, date?.toISOString())}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Generate and preview your custom report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={generateReport}
                  disabled={!reportConfig.dataSource || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>

                {previewData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {previewData.length} records found
                      </Badge>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              {Object.keys(previewData[0] || {}).map((key) => (
                                <th key={key} className="px-4 py-2 text-left text-sm font-medium">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.slice(0, 10).map((record, index) => (
                              <tr key={index} className="border-t">
                                {Object.values(record).map((value: any, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 text-sm">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewData.length > 10 && (
                        <div className="px-4 py-2 bg-muted text-sm text-muted-foreground text-center">
                          Showing first 10 of {previewData.length} records
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}