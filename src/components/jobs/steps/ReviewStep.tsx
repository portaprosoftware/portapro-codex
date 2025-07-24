import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Edit, User, Briefcase, Calendar, MapPin, Truck, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewStepProps {
  data: {
    customer: {
      id: string;
      name: string;
      address: string;
    } | null;
    jobType: 'delivery' | 'pickup' | 'service' | null;
    dateTime: {
      date: Date | null;
      time: string;
      timezone: string;
    };
    consumables: {
      billingMethod: 'per-use' | 'bundle' | 'subscription';
      items: Array<{
        id: string;
        consumableId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
        stockAvailable: number;
      }>;
      selectedBundle: string | null;
      subscriptionEnabled: boolean;
      subtotal: number;
    };
    location: {
      address: string;
      coordinates: {
        lat: number;
        lng: number;
      } | null;
      specialInstructions: string;
    };
    assignment: {
      driverId: string | null;
      vehicleId: string | null;
    };
    equipment: {
      items: Array<{
        id: string;
        name: string;
        quantity: number;
        type: 'equipment' | 'service';
      }>;
    };
  };
  onEdit: (step: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onEdit }) => {
  const jobTypeLabels = {
    delivery: 'Delivery',
    pickup: 'Pickup',
    service: 'Service',
  };

  const timezoneLabels = {
    'America/New_York': 'Eastern Time (ET)',
    'America/Chicago': 'Central Time (CT)',
    'America/Denver': 'Mountain Time (MT)',
    'America/Los_Angeles': 'Pacific Time (PT)',
  };

  const sections = [
    {
      step: 1,
      title: 'Customer',
      icon: User,
      content: data.customer ? (
        <div>
          <div className="font-medium text-gray-900">{data.customer.name}</div>
          <div className="text-sm text-gray-600">{data.customer.address}</div>
        </div>
      ) : (
        <div className="text-red-500">No customer selected</div>
      ),
      isComplete: data.customer !== null,
    },
    {
      step: 2,
      title: 'Job Type',
      icon: Briefcase,
      content: data.jobType ? (
        <Badge className="bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white">
          {jobTypeLabels[data.jobType]}
        </Badge>
      ) : (
        <div className="text-red-500">No job type selected</div>
      ),
      isComplete: data.jobType !== null,
    },
    {
      step: 3,
      title: 'Date & Time',
      icon: Calendar,
      content: data.dateTime.date ? (
        <div>
          <div className="font-medium text-gray-900">
            {format(data.dateTime.date, "EEEE, MMMM do, yyyy")}
          </div>
          <div className="text-sm text-gray-600">
            {data.dateTime.time} ({timezoneLabels[data.dateTime.timezone as keyof typeof timezoneLabels]})
          </div>
        </div>
      ) : (
        <div className="text-red-500">No date selected</div>
      ),
      isComplete: data.dateTime.date !== null,
    },
    {
      step: 4,
      title: 'Consumables & Pricing',
      icon: DollarSign,
      content: (
        <div>
          {data.consumables.billingMethod === 'per-use' && (
            <div>
              <div className="font-medium text-gray-900 mb-2">Per-Use Billing</div>
              {data.consumables.items.length > 0 ? (
                <div className="space-y-1">
                  {data.consumables.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <Badge variant="outline">{item.quantity} × ${item.unitPrice.toFixed(2)}</Badge>
                    </div>
                  ))}
                  {data.consumables.items.length > 3 && (
                    <div className="text-sm text-gray-500">+{data.consumables.items.length - 3} more...</div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>${data.consumables.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No items selected</div>
              )}
            </div>
          )}
          {data.consumables.billingMethod === 'bundle' && (
            <div>
              <div className="font-medium text-gray-900 mb-2">Bundle Pricing</div>
              {data.consumables.selectedBundle ? (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  ${data.consumables.subtotal.toFixed(2)} Bundle
                </Badge>
              ) : (
                <div className="text-gray-500">No bundle selected</div>
              )}
            </div>
          )}
          {data.consumables.billingMethod === 'subscription' && (
            <div>
              <div className="font-medium text-gray-900 mb-2">Subscription Plan</div>
              {data.consumables.subscriptionEnabled ? (
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  Unlimited Consumables ($200/month)
                </Badge>
              ) : (
                <div className="text-gray-500">Subscription not enabled</div>
              )}
            </div>
          )}
        </div>
      ),
      isComplete: (
        (data.consumables.billingMethod === 'per-use' && data.consumables.items.length > 0) ||
        (data.consumables.billingMethod === 'bundle' && data.consumables.selectedBundle !== null) ||
        (data.consumables.billingMethod === 'subscription' && data.consumables.subscriptionEnabled)
      ),
    },
    {
      step: 5,
      title: 'Location',
      icon: MapPin,
      content: data.location.address ? (
        <div>
          <div className="font-medium text-gray-900">{data.location.address}</div>
          {data.location.coordinates && (
            <div className="text-xs text-gray-500">
              GPS: {data.location.coordinates.lat.toFixed(6)}, {data.location.coordinates.lng.toFixed(6)}
            </div>
          )}
          {data.location.specialInstructions && (
            <div className="text-sm text-gray-600 mt-1">
              <strong>Instructions:</strong> {data.location.specialInstructions}
            </div>
          )}
        </div>
      ) : (
        <div className="text-red-500">No location specified</div>
      ),
      isComplete: data.location.address.length > 0,
    },
    {
      step: 6,
      title: 'Driver & Vehicle',
      icon: Truck,
      content: (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Driver:</span>
            <span className={data.assignment.driverId ? "text-gray-900" : "text-orange-500"}>
              {data.assignment.driverId ? "Assigned" : "Not assigned"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vehicle:</span>
            <span className={data.assignment.vehicleId ? "text-gray-900" : "text-orange-500"}>
              {data.assignment.vehicleId ? "Assigned" : "Not assigned"}
            </span>
          </div>
        </div>
      ),
      isComplete: data.assignment.driverId !== null,
    },
    {
      step: 7,
      title: 'Equipment & Services',
      icon: Package,
      content: data.equipment.items.length > 0 ? (
        <div>
          <div className="font-medium text-gray-900 mb-2">
            {data.equipment.items.length} item(s) selected
          </div>
          <div className="space-y-1">
            {data.equipment.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.name}</span>
                <Badge variant="outline">{item.quantity}</Badge>
              </div>
            ))}
            {data.equipment.items.length > 3 && (
              <div className="text-sm text-gray-500">
                +{data.equipment.items.length - 3} more...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-red-500">No equipment or services selected</div>
      ),
      isComplete: data.equipment.items.length > 0,
    },
  ];

  const allComplete = sections.every(section => section.isComplete);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review Job Details</h2>
        <p className="text-gray-600">Review all information before submitting the job</p>
      </div>

      {/* Job Summary */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          
          return (
            <div
              key={section.step}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    section.isComplete 
                      ? "bg-green-100 text-green-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{section.title}</h3>
                    {section.content}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(section.step)}
                  className="text-[#3366FF] hover:text-[#2952CC] hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Status */}
      <div className={`border-2 rounded-lg p-4 ${
        allComplete 
          ? "border-green-200 bg-green-50" 
          : "border-orange-200 bg-orange-50"
      }`}>
        <div className="flex items-center space-x-2">
          {allComplete ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">
                Ready to Submit
              </span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-orange-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-600 rounded-full" />
              </div>
              <span className="font-medium text-orange-900">
                Please complete all required sections
              </span>
            </>
          )}
        </div>
        {!allComplete && (
          <div className="text-sm text-orange-700 mt-2">
            Missing information in: {sections.filter(s => !s.isComplete).map(s => s.title).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};