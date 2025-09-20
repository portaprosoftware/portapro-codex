import React, { useState } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Eye
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
  status: 'completed' | 'pending_review' | 'approved';
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
    status: 'pending_review',
    duration: '35 mins',
    photos: 8
  },
  {
    id: 'R003',
    serviceName: 'Delivery & Setup',
    customerName: 'City Works Department',
    technician: 'Tom Davis',
    completedDate: '2024-01-17',
    status: 'approved',
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
          <div key={service.id} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h5 className="font-medium text-foreground">{service.name}</h5>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">${service.price}</div>
                <div className="text-xs text-muted-foreground">{service.duration}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {service.category}
                </Badge>
                {service.templateAssigned ? (
                  <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Template Assigned
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    No Template
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-1">
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
          <div key={template.id} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium text-foreground">{template.name}</h5>
                <p className="text-sm text-muted-foreground">
                  Used for: {template.serviceTypes.join(', ')}
                </p>
              </div>
              <div className="text-right">
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

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
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
          <div key={report.id} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h5 className="font-medium text-foreground">{report.serviceName}</h5>
                <p className="text-sm text-muted-foreground">Customer: {report.customerName}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{report.completedDate}</div>
                {report.status === 'completed' && (
                  <Badge className="bg-green-100 text-green-800 border-0 text-xs mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {report.status === 'pending_review' && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Review
                  </Badge>
                )}
                {report.status === 'approved' && (
                  <Badge className="bg-blue-100 text-blue-800 border-0 text-xs mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-1">
              <Button variant="outline" size="sm" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                View Report
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Download PDF
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Service & Reporting Hub</h3>
            <p className="text-green-100 text-sm">Schedule, document, and track service completions</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-0">
              <ClipboardCheck className="w-4 h-4 mr-1" />
              Live Demo
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="p-4">
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

        {/* Tab Content */}
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};