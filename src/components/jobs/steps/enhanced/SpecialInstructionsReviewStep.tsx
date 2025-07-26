import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Users, 
  Package, 
  Settings, 
  Truck,
  Calendar,
  DollarSign,
  Plus,
  UserPlus
} from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  selected: boolean;
}

interface ReviewData {
  specialInstructions: string;
  additionalContacts: Contact[];
  quickAddContact?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    title: string;
  };
}

interface SpecialInstructionsReviewStepProps {
  data: ReviewData;
  onUpdate: (data: ReviewData) => void;
  // All the wizard data for review
  jobTypeData: any;
  scheduleData: any;
  locationData: any;
  inventoryData: any;
  servicesData: any;
  crewData: any;
  customerContacts: Contact[];
}

export const SpecialInstructionsReviewStep: React.FC<SpecialInstructionsReviewStepProps> = ({ 
  data, 
  onUpdate,
  jobTypeData,
  scheduleData,
  locationData,
  inventoryData,
  servicesData,
  crewData,
  customerContacts = []
}) => {
  const [openSections, setOpenSections] = useState<string[]>(['summary']);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateSpecialInstructions = (instructions: string) => {
    onUpdate({
      ...data,
      specialInstructions: instructions
    });
  };

  const toggleContact = (contactId: string, selected: boolean) => {
    const updatedContacts = data.additionalContacts.map(contact =>
      contact.id === contactId ? { ...contact, selected } : contact
    );

    // If selecting and not already in the list, add from customer contacts
    if (selected && !data.additionalContacts.find(c => c.id === contactId)) {
      const customerContact = customerContacts.find(c => c.id === contactId);
      if (customerContact) {
        updatedContacts.push({ ...customerContact, selected: true });
      }
    }

    onUpdate({
      ...data,
      additionalContacts: updatedContacts.filter(c => c.selected)
    });
  };

  const updateQuickAddContact = (field: string, value: string) => {
    onUpdate({
      ...data,
      quickAddContact: {
        ...data.quickAddContact,
        [field]: value
      } as any
    });
  };

  const addQuickContact = () => {
    if (data.quickAddContact?.first_name && data.quickAddContact?.last_name) {
      const newContact: Contact = {
        id: `quick-${Date.now()}`,
        first_name: data.quickAddContact.first_name,
        last_name: data.quickAddContact.last_name,
        email: data.quickAddContact.email,
        phone: data.quickAddContact.phone,
        title: data.quickAddContact.title,
        selected: true
      };

      onUpdate({
        ...data,
        additionalContacts: [...data.additionalContacts, newContact],
        quickAddContact: {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          title: ''
        }
      });
      setShowQuickAdd(false);
    }
  };

  const getJobTypeSummary = () => {
    const type = jobTypeData?.jobType || 'delivery';
    const timezone = jobTypeData?.timezone || 'America/New_York';
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Job (${timezone})`;
  };

  const getScheduleSummary = () => {
    const parts = [];
    if (scheduleData?.deliveryDate) {
      parts.push(`Delivery: ${scheduleData.deliveryDate.toLocaleDateString()}`);
      if (scheduleData.deliveryTime) {
        parts[parts.length - 1] += ` at ${scheduleData.deliveryTime}`;
      }
    }
    
    // Handle partial pickups
    if (scheduleData?.partialPickups?.length > 0) {
      scheduleData.partialPickups.forEach((pickup: any, index: number) => {
        const dateStr = pickup.date instanceof Date ? pickup.date.toLocaleDateString() : pickup.date;
        let pickupStr = `Partial #${index + 1}: ${dateStr}`;
        if (pickup.addTime && pickup.time) {
          pickupStr += ` at ${pickup.time}`;
        }
        if (pickup.quantity) {
          pickupStr += ` (${pickup.quantity} units)`;
        }
        parts.push(pickupStr);
      });
    }
    
    // Handle final return date
    if (scheduleData?.returnDate) {
      let returnStr = `Final Return: ${scheduleData.returnDate.toLocaleDateString()}`;
      if (scheduleData.returnTime) {
        returnStr += ` at ${scheduleData.returnTime}`;
      }
      parts.push(returnStr);
    }
    
    if (scheduleData?.serviceDate) {
      parts.push(`Service: ${scheduleData.serviceDate.toLocaleDateString()}`);
    }
    return parts.join(' • ');
  };

  const getInventorySummary = () => {
    const bulkItems = inventoryData?.bulkItems?.filter((item: any) => item.selected_quantity > 0) || [];
    const individualItems = inventoryData?.selectedUnits || [];
    const consumables = inventoryData?.selectedConsumables || [];
    
    const parts = [];
    if (bulkItems.length > 0) {
      parts.push(`${bulkItems.length} bulk items`);
    }
    if (individualItems.length > 0) {
      parts.push(`${individualItems.length} specific units`);
    }
    if (consumables.length > 0) {
      parts.push(`${consumables.length} consumables`);
    }
    return parts.join(', ') || 'No inventory selected';
  };

  const getServicesSummary = () => {
    const services = servicesData?.selectedServices || [];
    if (services.length === 0) return 'No services selected';
    return services.map((s: any) => `${s.name} (${s.frequency})`).join(', ');
  };

  const getCrewSummary = () => {
    const driver = crewData?.selectedDriver;
    const vehicle = crewData?.selectedVehicle;
    const parts = [];
    
    if (driver) {
      parts.push(`Driver: ${driver.first_name} ${driver.last_name}`);
    }
    if (vehicle) {
      parts.push(`Vehicle: ${vehicle.license_plate}`);
    }
    return parts.join(' • ') || 'No crew assigned';
  };

  const getTotalCost = () => {
    const inventorySubtotal = inventoryData?.inventorySubtotal || 0;
    const consumablesSubtotal = inventoryData?.consumablesSubtotal || 0;
    const servicesSubtotal = servicesData?.servicesSubtotal || 0;
    return inventorySubtotal + consumablesSubtotal + servicesSubtotal;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Special Instructions & Review</h2>
        <p className="text-muted-foreground">Add final details and review your job configuration</p>
      </div>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Special Instructions</CardTitle>
          <CardDescription>
            Provide any special instructions or notes for the technician
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter special instructions, access codes, site-specific requirements, etc..."
            value={data.specialInstructions}
            onChange={(e) => updateSpecialInstructions(e.target.value)}
            className="min-h-24"
          />
        </CardContent>
      </Card>

      {/* Additional Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Additional Contacts</span>
              </CardTitle>
              <CardDescription>
                Select contacts who should receive job notifications
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Customer Contacts */}
          <div className="space-y-3">
            {customerContacts.map((contact) => (
              <div key={contact.id} className="flex items-center space-x-3">
                <Checkbox
                  checked={data.additionalContacts.some(c => c.id === contact.id)}
                  onCheckedChange={(checked) => toggleContact(contact.id, checked as boolean)}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contact.email} • {contact.phone}
                  </div>
                </div>
                {contact.title && (
                  <Badge variant="outline">{contact.title}</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Quick Add Contact */}
          {showQuickAdd && (
            <div className="mt-4 p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Add New Contact</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quick-first-name">First Name</Label>
                  <Input
                    id="quick-first-name"
                    value={data.quickAddContact?.first_name || ''}
                    onChange={(e) => updateQuickAddContact('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quick-last-name">Last Name</Label>
                  <Input
                    id="quick-last-name"
                    value={data.quickAddContact?.last_name || ''}
                    onChange={(e) => updateQuickAddContact('last_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quick-email">Email</Label>
                  <Input
                    id="quick-email"
                    type="email"
                    value={data.quickAddContact?.email || ''}
                    onChange={(e) => updateQuickAddContact('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quick-phone">Phone</Label>
                  <Input
                    id="quick-phone"
                    value={data.quickAddContact?.phone || ''}
                    onChange={(e) => updateQuickAddContact('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="quick-title">Title</Label>
                <Input
                  id="quick-title"
                  value={data.quickAddContact?.title || ''}
                  onChange={(e) => updateQuickAddContact('title', e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <Button variant="outline" onClick={() => setShowQuickAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={addQuickContact}>
                  Add Contact
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Job Review Summary</CardTitle>
          <CardDescription>
            Review all job details before creating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Summary */}
            <Collapsible 
              open={openSections.includes('summary')}
              onOpenChange={() => toggleSection('summary')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Quick Summary</span>
                </div>
                {openSections.includes('summary') ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 border border-border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Job Type:</span>
                    <p className="text-muted-foreground">{getJobTypeSummary()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Schedule:</span>
                    <p className="text-muted-foreground">{getScheduleSummary()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <p className="text-muted-foreground">
                      {locationData?.selectedLocation?.location_name || 'No location selected'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Total Cost:</span>
                    <p className="text-primary font-semibold">${getTotalCost().toFixed(2)}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Detailed Sections */}
            {[
              { key: 'inventory', icon: Package, title: 'Inventory & Consumables', content: getInventorySummary() },
              { key: 'services', icon: Settings, title: 'Services', content: getServicesSummary() },
              { key: 'crew', icon: Truck, title: 'Crew Assignment', content: getCrewSummary() }
            ].map((section) => (
              <Collapsible 
                key={section.key}
                open={openSections.includes(section.key)}
                onOpenChange={() => toggleSection(section.key)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted rounded-lg transition-colors">
                  <div className="flex items-center space-x-2">
                    <section.icon className="w-4 h-4" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  {openSections.includes(section.key) ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 border border-border rounded-lg">
                  <p className="text-muted-foreground">{section.content}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Final Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Cost Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {inventoryData?.inventorySubtotal > 0 && (
              <div className="flex justify-between">
                <span>Inventory:</span>
                <span>${inventoryData.inventorySubtotal.toFixed(2)}</span>
              </div>
            )}
            {inventoryData?.consumablesSubtotal > 0 && (
              <div className="flex justify-between">
                <span>Consumables:</span>
                <span>${inventoryData.consumablesSubtotal.toFixed(2)}</span>
              </div>
            )}
            {servicesData?.servicesSubtotal > 0 && (
              <div className="flex justify-between">
                <span>Services:</span>
                <span>${servicesData.servicesSubtotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>${getTotalCost().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};