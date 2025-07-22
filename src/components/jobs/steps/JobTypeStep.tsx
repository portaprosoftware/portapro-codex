
import React from 'react';
import { Briefcase, Truck, Package, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobTypeStepProps {
  data: 'delivery' | 'pickup' | 'service' | null;
  onUpdate: (jobType: 'delivery' | 'pickup' | 'service') => void;
}

const jobTypes = [
  {
    id: 'delivery' as const,
    name: 'Delivery',
    description: 'Deliver equipment to customer location',
    icon: Truck,
    color: 'blue',
  },
  {
    id: 'pickup' as const,
    name: 'Pickup',
    description: 'Pick up equipment from customer location',
    icon: Package,
    color: 'green',
  },
  {
    id: 'service' as const,
    name: 'Service',
    description: 'Service existing equipment on-site',
    icon: Wrench,
    color: 'orange',
  },
];

export const JobTypeStep: React.FC<JobTypeStepProps> = ({ data, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Briefcase className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Job Type</h2>
        <p className="text-gray-600">What type of job are you scheduling?</p>
      </div>

      <div className="grid gap-4">
        {jobTypes.map((jobType) => {
          const Icon = jobType.icon;
          const isSelected = data === jobType.id;
          
          return (
            <div
              key={jobType.id}
              className={cn(
                "p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected
                  ? "border-[#3366FF] bg-gradient-to-r from-blue-50 to-blue-100 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onUpdate(jobType.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isSelected
                    ? "bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    isSelected ? "text-[#3366FF]" : "text-gray-900"
                  )}>
                    {jobType.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {jobType.description}
                  </p>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                  isSelected
                    ? "border-[#3366FF] bg-[#3366FF]"
                    : "border-gray-300"
                )}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <span className="text-sm font-medium text-blue-900">
              Selected: {jobTypes.find(jt => jt.id === data)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
