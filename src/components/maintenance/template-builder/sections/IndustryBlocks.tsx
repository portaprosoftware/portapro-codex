import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, 
  MapPin, 
  Truck, 
  Wrench, 
  Calendar, 
  ClipboardCheck, 
  FileSignature 
} from 'lucide-react';
import { SectionBlockType } from '../types';

interface IndustryBlock {
  type: SectionBlockType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'industry';
  features: string[];
}

export const industryBlocks: IndustryBlock[] = [
  {
    type: 'per_unit_loop',
    title: 'Per-Unit Service Loop',
    description: 'Scan each unit, record status, restock, and condition with photos',
    icon: <Scan className="w-5 h-5" />,
    category: 'industry',
    features: ['QR Scan', 'Status Quick-Tap', 'Restock Tracking', 'Auto Photos', 'GPS Lock'],
  },
  {
    type: 'delivery_setup',
    title: 'Delivery & Setup',
    description: 'Unit placement, site contact, setup checklist, and acceptance signature',
    icon: <Truck className="w-5 h-5" />,
    category: 'industry',
    features: ['Site Contact', 'GPS Pin', 'Unit Types', 'Setup Checklist', 'Customer Signature'],
  },
  {
    type: 'pickup_removal',
    title: 'Pickup / Removal',
    description: 'Count retrieved, exceptions, site cleanup verification',
    icon: <Truck className="w-5 h-5" />,
    category: 'industry',
    features: ['Count Tracking', 'Exceptions', 'Site Cleanup', 'Fee Tracking'],
  },
  {
    type: 'event_service',
    title: 'Event Service & Reconciliation',
    description: 'Event info, layout zones, ADA counts, and variance tracking',
    icon: <Calendar className="w-5 h-5" />,
    category: 'industry',
    features: ['Event Details', 'Layout Zones', 'Count Reconciliation', 'Service Frequency'],
  },
  {
    type: 'repair_damage',
    title: 'Repair / Damage',
    description: 'Issue codes, parts used, labor time, and resolution tracking',
    icon: <Wrench className="w-5 h-5" />,
    category: 'industry',
    features: ['Issue Codes', 'Parts Tracking', 'Labor Time', 'Before/After Photos'],
  },
  {
    type: 'compliance_safety',
    title: 'Compliance & Safety',
    description: 'Site survey, ADA checklist, hazards, and recommendations',
    icon: <ClipboardCheck className="w-5 h-5" />,
    category: 'industry',
    features: ['ADA Compliance', 'Hazard ID', 'Site Photos', 'Recommendations'],
  },
  {
    type: 'customer_signoff',
    title: 'Customer Sign-off',
    description: 'Name, role, signature with timestamp and GPS lock',
    icon: <FileSignature className="w-5 h-5" />,
    category: 'industry',
    features: ['Name & Role', 'Signature Pad', 'Auto Timestamp', 'GPS Lock'],
  },
];

interface IndustryBlockCardProps {
  block: IndustryBlock;
  onAdd: (blockType: SectionBlockType) => void;
}

export const IndustryBlockCard: React.FC<IndustryBlockCardProps> = ({ block, onAdd }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all group border-2 hover:border-primary"
      onClick={() => onAdd(block.type)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                {block.icon}
              </div>
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                Industry
              </Badge>
            </div>
            <CardTitle className="text-base mt-2">{block.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm mt-2">
          {block.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {block.features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs font-normal">
              {feature}
            </Badge>
          ))}
        </div>
        <div className="mt-4 text-sm text-primary font-medium group-hover:underline">
          Click to add →
        </div>
      </CardContent>
    </Card>
  );
};
