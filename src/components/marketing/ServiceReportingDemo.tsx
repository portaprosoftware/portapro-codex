import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  Droplets, 
  ShieldCheck, 
  Truck, 
  FileText, 
  Camera, 
  CheckSquare, 
  Signature,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  elements: string[];
  color: string;
}

const services: Service[] = [
  {
    id: 'pumping',
    name: 'Pumping Service',
    icon: <Droplets className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Standard waste removal and pumping'
  },
  {
    id: 'maintenance',
    name: 'Unit Maintenance',
    icon: <Wrench className="w-5 h-5" />,
    color: 'bg-orange-500',
    description: 'Repairs, cleaning, and upkeep'
  },
  {
    id: 'inspection',
    name: 'Site Inspection',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'bg-green-500',
    description: 'Safety and compliance checks'
  },
  {
    id: 'delivery',
    name: 'Delivery/Pickup',
    icon: <Truck className="w-5 h-5" />,
    color: 'bg-purple-500',
    description: 'Unit placement and removal'
  }
];

const reportTemplates: Record<string, ReportTemplate> = {
  pumping: {
    id: 'pump-report',
    name: 'Standard Pump Report',
    color: 'bg-blue-500',
    elements: ['Volume pumped', 'Photos', 'Site notes', 'Digital signature', 'Timestamp']
  },
  maintenance: {
    id: 'maintenance-report',
    name: 'Maintenance Checklist',
    color: 'bg-orange-500',
    elements: ['Parts used', 'Work performed', 'Before/after photos', 'Time spent', 'Customer signature']
  },
  inspection: {
    id: 'inspection-report',
    name: 'Site Inspection Form',
    color: 'bg-green-500',
    elements: ['Safety checklist', 'Compliance status', 'Issue photos', 'Recommendations', 'Inspector signature']
  },
  delivery: {
    id: 'delivery-report',
    name: 'Delivery Confirmation',
    color: 'bg-purple-500',
    elements: ['Unit placement photo', 'Access notes', 'Customer contact', 'GPS coordinates', 'Delivery signature']
  }
};

const elementIcons: Record<string, React.ReactNode> = {
  'Volume pumped': <Droplets className="w-4 h-4" />,
  'Photos': <Camera className="w-4 h-4" />,
  'Site notes': <FileText className="w-4 h-4" />,
  'Digital signature': <Signature className="w-4 h-4" />,
  'Timestamp': <Clock className="w-4 h-4" />,
  'Parts used': <Wrench className="w-4 h-4" />,
  'Work performed': <CheckSquare className="w-4 h-4" />,
  'Before/after photos': <Camera className="w-4 h-4" />,
  'Time spent': <Clock className="w-4 h-4" />,
  'Customer signature': <Signature className="w-4 h-4" />,
  'Safety checklist': <CheckSquare className="w-4 h-4" />,
  'Compliance status': <ShieldCheck className="w-4 h-4" />,
  'Issue photos': <Camera className="w-4 h-4" />,
  'Recommendations': <FileText className="w-4 h-4" />,
  'Inspector signature': <Signature className="w-4 h-4" />,
  'Unit placement photo': <Camera className="w-4 h-4" />,
  'Access notes': <FileText className="w-4 h-4" />,
  'Customer contact': <FileText className="w-4 h-4" />,
  'GPS coordinates': <FileText className="w-4 h-4" />,
  'Delivery signature': <Signature className="w-4 h-4" />
};

export const ServiceReportingDemo: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string>('pumping');
  const [showTemplate, setShowTemplate] = useState(false);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setShowTemplate(false);
    // Automatically show template after a short delay for better UX
    setTimeout(() => setShowTemplate(true), 500);
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedTemplate = reportTemplates[selectedService];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border p-6 shadow-sm">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">Interactive Demo</h3>
        <p className="text-sm text-muted-foreground">Click a service type to see its paired report template</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Services */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Available Services
          </h4>
          <div className="space-y-2">
            {services.map((service) => (
              <Button
                key={service.id}
                variant={selectedService === service.id ? "default" : "outline"}
                className={`w-full justify-start h-auto p-3 transition-all ${
                  selectedService === service.id 
                    ? `${service.color} text-white hover:opacity-90` 
                    : 'hover:border-primary'
                }`}
                onClick={() => handleServiceSelect(service.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${selectedService === service.id ? 'bg-white/20' : service.color} ${selectedService === service.id ? 'text-white' : 'text-white'}`}>
                    {service.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{service.name}</div>
                    <div className={`text-xs ${selectedService === service.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {service.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Right: Report Template */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Auto-Assigned Template
          </h4>
          
          {selectedServiceData && (
            <div className={`rounded-xl border-2 transition-all duration-500 ${
              showTemplate ? 'border-primary bg-primary/5 transform scale-100' : 'border-gray-200 bg-gray-50 transform scale-95 opacity-50'
            }`}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${selectedTemplate.color} text-white`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{selectedTemplate.name}</div>
                    <div className="text-xs text-muted-foreground">Auto-assigned to {selectedServiceData.name}</div>
                  </div>
                </div>

                {showTemplate && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Template Elements:</div>
                    {selectedTemplate.elements.map((element, index) => (
                      <div 
                        key={element} 
                        className="flex items-center gap-2 text-sm p-2 rounded bg-white border transition-all"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="text-muted-foreground">
                          {elementIcons[element] || <FileText className="w-4 h-4" />}
                        </div>
                        <span className="text-foreground">{element}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connection indicator */}
          {showTemplate && (
            <div className="flex items-center justify-center py-2 animate-fade-in">
              <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs text-primary font-medium ml-2">Auto-paired on job creation</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <strong>How it works:</strong> When you schedule a service, the matching report template is automatically assigned. 
          Drivers complete these forms in the field with photos, signatures, and data—all synced in real-time.
        </div>
      </div>
    </div>
  );
};

export default ServiceReportingDemo;