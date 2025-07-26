import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Users, ArrowRight, FileText, Calendar, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

interface BulkTemplateAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  scheduled_date: string;
  status: string;
  customers: {
    name: string;
  } | null;
  assigned_template_ids: string[];
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  description?: string;
}

export const BulkTemplateAssignment: React.FC<BulkTemplateAssignmentProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [step, setStep] = useState<'jobs' | 'templates' | 'review'>('jobs');

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['bulk-assignment-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_type,
          scheduled_date,
          status,
          assigned_template_ids,
          customers (
            name
          )
        `)
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as Job[];
    },
    enabled: open
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['bulk-assignment-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_report_templates')
        .select('id, name, template_type, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Template[];
    },
    enabled: open
  });

  const handleJobToggle = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleBulkAssign = async () => {
    try {
      // Update each selected job with the new template assignments
      for (const jobId of selectedJobs) {
        const { error } = await supabase
          .from('jobs')
          .update({ assigned_template_ids: selectedTemplates })
          .eq('id', jobId);

        if (error) throw error;
      }

      toast.success(`Successfully assigned ${selectedTemplates.length} templates to ${selectedJobs.length} jobs`);
      onOpenChange(false);
      
      // Reset state
      setSelectedJobs([]);
      setSelectedTemplates([]);
      setStep('jobs');
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      toast.error('Failed to assign templates');
    }
  };

  const getJobTypeBadge = (jobType: string) => {
    const types = {
      delivery: { label: 'Delivery', color: 'bg-blue-500' },
      pickup: { label: 'Pickup', color: 'bg-purple-500' },
      service: { label: 'Service', color: 'bg-orange-500' },
      return: { label: 'Return', color: 'bg-teal-500' },
    };
    
    const config = types[jobType as keyof typeof types] || { label: jobType, color: 'bg-gray-500' };
    
    return (
      <Badge className={`text-white ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cleaning':
        return '🧹';
      case 'inspection':
        return '🔍';
      case 'maintenance':
        return '🔧';
      case 'repair':
        return '⚙️';
      default:
        return '📋';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="w-5 h-5" />
            <span>Bulk Template Assignment</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 ${step === 'jobs' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'jobs' ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span>Select Jobs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${step === 'templates' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'templates' ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span>Select Templates</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span>Review & Assign</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Select Jobs */}
          {step === 'jobs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Select Jobs for Template Assignment</h3>
                <Badge variant="outline">
                  {selectedJobs.length} selected
                </Badge>
              </div>

              <div className="grid gap-3">
                {jobsLoading ? (
                  <div className="text-center py-8">Loading jobs...</div>
                ) : (
                  jobs.map((job) => (
                    <Card key={job.id} className={`cursor-pointer transition-colors ${selectedJobs.includes(job.id) ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedJobs.includes(job.id)}
                            onCheckedChange={() => handleJobToggle(job.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium">{job.job_number}</span>
                              {getJobTypeBadge(job.job_type)}
                              <Badge variant="outline">{job.status}</Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>📅 {new Date(job.scheduled_date).toLocaleDateString()}</span>
                              <span>{job.customers?.name || 'No customer'}</span>
                              {job.assigned_template_ids?.length > 0 && (
                                <span className="text-orange-600">
                                  ⚠️ {job.assigned_template_ids.length} templates already assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Templates */}
          {step === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Select Templates to Assign</h3>
                <Badge variant="outline">
                  {selectedTemplates.length} selected
                </Badge>
              </div>

              <div className="grid gap-3">
                {templatesLoading ? (
                  <div className="text-center py-8">Loading templates...</div>
                ) : (
                  templates.map((template) => (
                    <Card key={template.id} className={`cursor-pointer transition-colors ${selectedTemplates.includes(template.id) ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedTemplates.includes(template.id)}
                            onCheckedChange={() => handleTemplateToggle(template.id)}
                          />
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getTemplateTypeIcon(template.template_type)}</span>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {template.description}
                              </div>
                              <Badge variant="outline" className="mt-1">
                                {template.template_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Assign */}
          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review Assignment</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Selected Jobs ({selectedJobs.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedJobs.map(jobId => {
                      const job = jobs.find(j => j.id === jobId);
                      return job ? (
                        <div key={jobId} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span>{job.job_number}</span>
                          <span className="text-sm text-muted-foreground">{job.customers?.name}</span>
                        </div>
                      ) : null;
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Selected Templates ({selectedTemplates.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedTemplates.map(templateId => {
                      const template = templates.find(t => t.id === templateId);
                      return template ? (
                        <div key={templateId} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center space-x-2">
                            <span>{getTemplateTypeIcon(template.template_type)}</span>
                            <span>{template.name}</span>
                          </div>
                          <Badge variant="outline">{template.template_type}</Badge>
                        </div>
                      ) : null;
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
                <p className="text-blue-800">
                  You are about to assign <strong>{selectedTemplates.length} templates</strong> to <strong>{selectedJobs.length} jobs</strong>.
                  This will replace any existing template assignments for these jobs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <div className="flex items-center space-x-2">
            {step !== 'jobs' && (
              <Button 
                variant="outline"
                onClick={() => setStep(step === 'review' ? 'templates' : 'jobs')}
              >
                Previous
              </Button>
            )}
            
            {step === 'jobs' && (
              <Button 
                onClick={() => setStep('templates')}
                disabled={selectedJobs.length === 0}
              >
                Next: Select Templates
              </Button>
            )}
            
            {step === 'templates' && (
              <Button 
                onClick={() => setStep('review')}
                disabled={selectedTemplates.length === 0}
              >
                Next: Review
              </Button>
            )}
            
            {step === 'review' && (
              <Button 
                onClick={handleBulkAssign}
                disabled={selectedJobs.length === 0 || selectedTemplates.length === 0}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Assign Templates
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};