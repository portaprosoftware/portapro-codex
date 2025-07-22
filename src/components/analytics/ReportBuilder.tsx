
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, Download, Save, Play, Calendar, Database, Filter, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { from: Date; to: Date };
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ isOpen, onClose, dateRange }) => {
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>([]);
  const [visualizationType, setVisualizationType] = useState('table');
  const [reportName, setReportName] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const dataSources = [
    { id: 'jobs', label: 'Jobs', icon: '📋' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'invoices', label: 'Invoices', icon: '💰' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' }
  ];

  const availableColumns = {
    jobs: ['id', 'job_type', 'status', 'scheduled_date', 'customer_name', 'driver_name', 'total_price'],
    customers: ['id', 'name', 'email', 'phone', 'type', 'created_at'],
    invoices: ['id', 'invoice_number', 'amount', 'status', 'due_date', 'customer_name'],
    maintenance: ['id', 'vehicle_id', 'maintenance_type', 'status', 'cost', 'scheduled_date']
  };

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' }
  ];

  const visualizationTypes = [
    { id: 'table', label: 'Table', icon: '📊' },
    { id: 'bar', label: 'Bar Chart', icon: '📊' },
    { id: 'line', label: 'Line Chart', icon: '📈' },
    { id: 'pie', label: 'Pie Chart', icon: '🥧' }
  ];

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  };

  const updateFilter = (index: number, key: string, value: string) => {
    setFilters(prev => prev.map((filter, i) =>
      i === index ? { ...filter, [key]: value } : filter
    ));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndRun = () => {
    // Implementation for saving and running the report
    console.log('Report saved and running:', {
      dataSource: selectedDataSource,
      columns: selectedColumns,
      filters,
      visualization: visualizationType,
      name: reportName,
      scheduled: isScheduled
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Slide-out Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[70%] max-w-4xl bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Builder</h2>
              <p className="text-gray-600">Create custom reports and analytics</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Report Name */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Save className="w-5 h-5 mr-2" />
                Report Details
              </h3>
              <Input
                placeholder="Enter report name..."
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full"
              />
            </Card>

            {/* Data Source Selection */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Data Source
              </h3>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a data source..." />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      <span className="flex items-center">
                        <span className="mr-2">{source.icon}</span>
                        {source.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Column Selection */}
            {selectedDataSource && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Select Columns</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableColumns[selectedDataSource as keyof typeof availableColumns]?.map((column) => (
                    <label key={column} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column)}
                        onChange={() => handleColumnToggle(column)}
                        className="rounded"
                      />
                      <span className="text-sm">{column.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {/* Filters */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </h3>
                <Button variant="outline" size="sm" onClick={addFilter}>
                  Add Filter
                </Button>
              </div>
              
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded">
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(index, 'field', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDataSource && availableColumns[selectedDataSource as keyof typeof availableColumns]?.map((column) => (
                          <SelectItem key={column} value={column}>
                            {column.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(index, 'operator', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Visualization Type */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                Visualization
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {visualizationTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={visualizationType === type.id ? 'default' : 'outline'}
                    onClick={() => setVisualizationType(type.id)}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <span className="text-lg mb-1">{type.icon}</span>
                    <span className="text-sm">{type.label}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Schedule Toggle */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Report
                  </h3>
                  <p className="text-sm text-gray-600">Run this report automatically</p>
                </div>
                <Switch
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                />
              </div>
            </Card>

            {/* Preview Area */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Live Preview</h3>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  {selectedDataSource ? 
                    `Preview for ${selectedDataSource} data will appear here...` :
                    'Select a data source to see preview'
                  }
                </p>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="outline" disabled={!selectedDataSource}>
                <Download className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSaveAndRun}
                disabled={!selectedDataSource || !reportName}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Save & Run
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
