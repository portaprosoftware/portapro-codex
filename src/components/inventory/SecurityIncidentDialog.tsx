import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePadlockSecurity } from '@/hooks/usePadlockSecurity';
import { AlertTriangle, Shield, Lock, Key, HelpCircle } from 'lucide-react';

interface SecurityIncidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
}

const incidentTypes = [
  { 
    value: 'missing_padlock', 
    label: 'Missing Padlock', 
    icon: AlertTriangle,
    description: 'Padlock is completely missing from unit'
  },
  { 
    value: 'damaged_padlock', 
    label: 'Damaged Padlock', 
    icon: Shield,
    description: 'Padlock is damaged or broken'
  },
  { 
    value: 'unauthorized_access', 
    label: 'Unauthorized Access', 
    icon: Lock,
    description: 'Evidence of unauthorized access or tampering'
  },
  { 
    value: 'lost_key', 
    label: 'Lost Key', 
    icon: Key,
    description: 'Physical key has been lost'
  },
  { 
    value: 'forgotten_combination', 
    label: 'Forgotten Combination', 
    icon: HelpCircle,
    description: 'Combination code has been forgotten'
  }
];

const severityLevels = [
  { value: 'low', label: 'Low', color: 'text-blue-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' }
];

export const SecurityIncidentDialog: React.FC<SecurityIncidentDialogProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
}) => {
  const { reportIncident, isReportingIncident } = usePadlockSecurity();
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!incidentType || !description.trim()) {
      return;
    }

    reportIncident({
      itemId,
      incidentType,
      description: description.trim(),
      severity
    });

    // Reset form and close
    setIncidentType('');
    setSeverity('medium');
    setDescription('');
    onClose();
  };

  const selectedIncidentType = incidentTypes.find(type => type.value === incidentType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report Security Incident
          </DialogTitle>
          <DialogDescription>
            Report a security incident for unit {itemCode}. This will be logged and tracked for resolution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Incident Type</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedIncidentType && (
              <p className="text-xs text-muted-foreground">
                {selectedIncidentType.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <span className={level.color}>{level.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed description of the incident, including when it was discovered, any evidence, and potential impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isReportingIncident}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isReportingIncident || !incidentType || !description.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isReportingIncident ? 'Reporting...' : 'Report Incident'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};