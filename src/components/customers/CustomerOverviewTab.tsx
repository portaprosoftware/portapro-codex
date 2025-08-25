import React, { useState } from 'react';
import { User, FileText } from 'lucide-react';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { CustomerNotesTab } from './CustomerNotesTab';

interface Customer {
  id: string;
  name: string;
  customer_type: "events_festivals" | "construction" | "municipal_government" | "private_events_weddings" | "sports_recreation" | "emergency_disaster_relief" | "commercial" | "restaurants" | "retail" | "other" | "not_selected";
  email?: string;
  phone?: string;
  service_street: string;
  service_street2?: string;
  service_city: string;
  service_state: string;
  service_zip: string;
  billing_differs_from_service?: boolean;
  billing_street?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  default_service_differs_from_main?: boolean;
  default_service_street?: string;
  default_service_street2?: string;
  default_service_city?: string;
  default_service_state?: string;
  default_service_zip?: string;
  deposit_required?: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  address?: string;
  important_information?: string;
  notes?: string;
}

interface CustomerOverviewTabProps {
  customer: Customer;
}

export function CustomerOverviewTab({ customer }: CustomerOverviewTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('details');

  return (
    <div className="w-full">
      {/* Toggle Switch for Overview */}
      <div className="mb-6 flex">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setActiveSubTab('details')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              activeSubTab === 'details'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              activeSubTab === 'notes'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Notes
          </button>
        </div>
      </div>

      {/* Active Sub-tab Content */}
      <div className="mt-6">
        {activeSubTab === 'details' ? (
          <CustomerInfoPanel customer={customer} />
        ) : (
          <CustomerNotesTab customerId={customer.id} />
        )}
      </div>
    </div>
  );
}