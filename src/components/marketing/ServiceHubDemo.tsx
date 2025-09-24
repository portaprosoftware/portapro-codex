import React, { useState } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ClipboardCheck, 
  FileText, 
  Clock,
  CheckCircle,
  Wrench,
  Truck,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Camera,
  Signature,
  Smartphone,
  AlertTriangle,
  Plus,
  Edit,
  Eye,
  ChevronDown,
  Menu
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  templateAssigned: boolean;
  defaultTemplate?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  serviceTypes: string[];
  elements: string[];
  completedCount: number;
  averageTime: string;
}

interface CompletedReport {
  id: string;
  serviceName: string;
  customerName: string;
  technician: string;
  completedDate: string;
  status: 'completed' | 'incomplete';
  duration: string;
  photos: number;
}

// Mock data for services
const mockServices: Service[] = [
  {
    id: 'S001',
    name: 'Standard Pumping',
    category: 'Pumping',
    price: 85,
    duration: '15-20 mins',
    description: 'Complete waste removal and tank cleaning',
    templateAssigned: true,
    defaultTemplate: 'Pumping Service Report'
  },
  {
    id: 'S002',
    name: 'Deep Clean & Maintenance',
    category: 'Maintenance',
    price: 45,
    duration: '30-45 mins',
    description: 'Full sanitization and minor repairs',
    templateAssigned: true,
    defaultTemplate: 'Maintenance Report'
  },
  {
    id: 'S003',
    name: 'Delivery & Setup',
    category: 'Delivery',
    price: 65,
    duration: '10-15 mins',
    description: 'Unit delivery and proper positioning',
    templateAssigned: true,
    defaultTemplate: 'Delivery Confirmation'
  },
  {
    id: 'S004',
    name: 'Damage Inspection',
    category: 'Inspection',
    price: 35,
    duration: '20-30 mins',
    description: 'Thorough damage assessment',
    templateAssigned: false
  }
];

// Mock data for templates
const mockTemplates: ReportTemplate[] = [
  {
    id: 'T001',
    name: 'Pumping Service Report',
    serviceTypes: ['Standard Pumping', 'Emergency Pumping'],
    elements: ['Before Photo', 'Waste Level Check', 'Tank Condition', 'After Photo', 'Customer Signature'],
    completedCount: 127,
    averageTime: '3.2 mins'
  },
  {
    id: 'T002',
    name: 'Maintenance Report',
    serviceTypes: ['Deep Clean & Maintenance', 'Repair Service'],
    elements: ['Damage Assessment', 'Parts Used', 'Before/After Photos', 'Work Description', 'Time Tracking'],
    completedCount: 89,
    averageTime: '4.1 mins'
  },
  {
    id: 'T003',
    name: 'Delivery Confirmation',
    serviceTypes: ['Delivery & Setup', 'Pickup Service'],
    elements: ['Unit Condition', 'Placement Photo', 'GPS Location', 'Customer Signature', 'Special Instructions'],
    completedCount: 203,
    averageTime: '2.8 mins'
  }
];

// Mock data for completed reports
const mockCompletedReports: CompletedReport[] = [
  {
    id: 'R001',
    serviceName: 'Standard Pumping',
    customerName: 'ABC Construction',
    technician: 'Mike Johnson',
    completedDate: '2024-01-18',
    status: 'completed',
    duration: '18 mins',
    photos: 4
  },
  {
    id: 'R002',
    serviceName: 'Deep Clean & Maintenance',
    customerName: 'Metro Events LLC',
    technician: 'Sarah Wilson',
    completedDate: '2024-01-18',
    status: 'incomplete',
    duration: '35 mins',
    photos: 8
  },
  {
    id: 'R003',
    serviceName: 'Delivery & Setup',
    customerName: 'City Works Department',
    technician: 'Tom Davis',
    completedDate: '2024-01-17',
    status: 'incomplete',
    duration: '12 mins',
    photos: 3
  },
  {
    id: 'R004',
    serviceName: 'Standard Pumping',
    customerName: 'Riverside Shopping Center',
    technician: 'Alex Martinez',
    completedDate: '2024-01-17',
    status: 'completed',
    duration: '22 mins',
    photos: 6
  }
];

export const ServiceHubDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('catalog');

  const tabs = [
    { id: 'catalog', label: 'Service Catalog', icon: ClipboardCheck },
    { id: 'templates', label: 'Report Templates', icon: FileText },
    { id: 'records', label: 'Completed Records', icon: CheckCircle }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  const renderServiceCatalog = () => (
    <div className="space-y-4">
      <div className="text-center bg-muted rounded-lg p-4">
        <h4 className="text-lg font-semibold text-foreground">Service Catalog</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {mockServices.length} services with auto-assigned templates
        </p>
      </div>

      <div className="grid gap-3">
        {mockServices.map((service) => (
          <div key={service.id} className="border rounded-lg p-3 sm:p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-foreground truncate">{service.name}</h5>
                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
              </div>
              {/* Hide price section on mobile */}
              <div className="hidden md:block text-right flex-shrink-0">
                <div className="text-lg font-bold text-foreground">${service.price}</div>
                <div className="text-xs text-muted-foreground">{service.duration}</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  className={`text-xs font-medium text-white border-0 ${
                    service.category === 'Pumping' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    service.category === 'Maintenance' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    service.category === 'Delivery' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    service.category === 'Inspection' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}
                >
                  {service.category}
                </Badge>
                {service.templateAssigned ? (
                  <Badge variant="outline" className="text-xs border-green-600 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Template Assigned
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-orange-600 text-orange-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    No Template
                  </Badge>
                )}
              </div>
              
              {/* Hide buttons on mobile */}
              <div className="hidden md:flex gap-1">
                <Button variant="outline" size="sm" className="text-xs">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Assign Template
                </Button>
              </div>
            </div>

            {service.defaultTemplate && (
              <div className="mt-2 text-xs text-muted-foreground">
                Default Template: <span className="font-medium">{service.defaultTemplate}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportTemplates = () => (
    <div className="space-y-4">
      <div className="text-center bg-muted rounded-lg p-4">
        <h4 className="text-lg font-semibold text-foreground">Report Templates</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {mockTemplates.length} templates configured for different service types
        </p>
      </div>

      <div className="grid gap-3">
        {mockTemplates.map((template) => (
          <div key={template.id} className="border rounded-lg p-3 sm:p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-foreground">{template.name}</h5>
                <p className="text-sm text-muted-foreground">
                  Used for: {template.serviceTypes.join(', ')}
                </p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-sm font-medium text-foreground">{template.completedCount} completed</div>
                <div className="text-xs text-muted-foreground">Avg: {template.averageTime}</div>
              </div>
            </div>

            <div className="mb-3">
              <h6 className="text-sm font-medium text-foreground mb-2">Template Elements:</h6>
              <div className="flex flex-wrap gap-1">
                {template.elements.map((element, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {element}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white border-0 text-xs font-bold">
                  <FileText className="w-3 h-3 mr-1" />
                  {template.elements.length} Elements
                </Badge>
              </div>
              
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Edit className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium text-foreground">{template.name}</h5>
                <p className="text-sm text-muted-foreground">
                  Used for: {template.serviceTypes.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{template.completedCount} completed</div>
              </div>
            </div>

            <div className="mb-3">
              <h6 className="text-sm font-medium text-foreground mb-2">Template Elements:</h6>
              <div className="flex flex-wrap gap-1">
                {template.elements.map((element, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {element}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white border-0 text-xs font-bold">
                  <FileText className="w-3 h-3 mr-1" />
                  {template.elements.length} Elements
                </Badge>
              </div>
              
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompletedRecords = () => (
    <div className="space-y-4">
      <div className="text-center bg-muted rounded-lg p-4">
        <h4 className="text-lg font-semibold text-foreground">Completed Records & Reports</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Recent service completions with documentation
        </p>
      </div>

      <div className="grid gap-3">
        {mockCompletedReports.map((report) => (
          <div key={report.id} className="border rounded-lg p-3 sm:p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-foreground">{report.serviceName}</h5>
                <p className="text-sm text-muted-foreground">Customer: {report.customerName}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {report.technician}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {report.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {report.photos} photos
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-sm font-medium text-foreground mb-2">{report.completedDate}</div>
                {report.status === 'completed' && (
                  <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0 text-xs font-bold">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {report.status === 'incomplete' && (
                  <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 text-xs font-bold">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Incomplete
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-2">
              <Button variant="outline" size="sm" className="text-xs bg-white hover:bg-gray-50 border-gray-300 w-full sm:w-auto">
                <Eye className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">View Report</span>
                <span className="sm:hidden">View</span>
              </Button>
              <Button variant="outline" size="sm" className="text-xs bg-white hover:bg-gray-50 border-gray-300 w-full sm:w-auto">
                <FileText className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">Download</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'catalog':
        return renderServiceCatalog();
      case 'templates':
        return renderReportTemplates();
      case 'records':
        return renderCompletedRecords();
      default:
        return renderServiceCatalog();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold leading-tight">Service & Reporting Hub</h3>
            <p className="text-blue-100 text-sm mt-1">Schedule, document, and track service completions</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-blue-100 text-xs sm:text-sm">
              Interactive demo - click tabs to explore different sections
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 sm:p-6">
        {/* Desktop Navigation Pills */}
        <div className="hidden md:block">
          <TabNav ariaLabel="Service hub navigation">
            <TabNav.Item
              to="#catalog"
              isActive={activeTab === 'catalog'}
              onClick={() => setActiveTab('catalog')}
            >
              <ClipboardCheck className="w-4 h-4" />
              Service Catalog
            </TabNav.Item>
            <TabNav.Item
              to="#templates"
              isActive={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
            >
              <FileText className="w-4 h-4" />
              Report Templates
            </TabNav.Item>
            <TabNav.Item
              to="#records"
              isActive={activeTab === 'records'}
              onClick={() => setActiveTab('records')}
            >
              <CheckCircle className="w-4 h-4" />
              Completed Records & Reports
            </TabNav.Item>
          </TabNav>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <activeTabData.icon className="w-4 h-4" />
                  {activeTabData.label}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full bg-white border border-gray-200 shadow-lg z-50">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 cursor-pointer hover:bg-gray-100 ${
                    activeTab === tab.id ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab Content */}
        <div className="mt-4 sm:mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};