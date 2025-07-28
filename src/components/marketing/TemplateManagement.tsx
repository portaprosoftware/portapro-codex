
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, Mail, MessageSquare, Grid3X3, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/components/ui/use-toast';
import { CreateTemplateModal } from './CreateTemplateModal';
import { EditTemplateModal } from './EditTemplateModal';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  category: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

export const TemplateManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'system' | 'user'>('system');
  const [typeFilter, setTypeFilter] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [emailSystemExpanded, setEmailSystemExpanded] = useState(false);
  const [emailUserExpanded, setEmailUserExpanded] = useState(false);
  const [smsSystemExpanded, setSmsSystemExpanded] = useState(false);
  const [smsUserExpanded, setSmsUserExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Template[];
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('communication_templates')
        .update({ is_active: false })
        .eq('id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Template deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error deleting template', variant: 'destructive' });
    }
  });

  // Group and sort templates
  const getGroupedTemplates = () => {
    const filteredTemplates = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === 'all' || 
        template.category.toLowerCase() === typeFilter.toLowerCase();
      
      return matchesSearch && matchesType;
    });

    // Group by type and source
    const emailSystem = filteredTemplates
      .filter(t => t.type === 'email' && t.source === 'system')
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const emailUser = filteredTemplates
      .filter(t => t.type === 'email' && t.source !== 'system')
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const smsSystem = filteredTemplates
      .filter(t => t.type === 'sms' && t.source === 'system')
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const smsUser = filteredTemplates
      .filter(t => t.type === 'sms' && t.source !== 'system')
      .sort((a, b) => a.name.localeCompare(b.name));

    return { emailSystem, emailUser, smsSystem, smsUser };
  };

  const { emailSystem, emailUser, smsSystem, smsUser } = getGroupedTemplates();

  // Render individual template item
  const renderTemplateItem = (template: Template) => (
    <Card key={template.id} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            {template.type === 'email' ? (
              <Mail className="w-4 h-4 text-blue-500" />
            ) : (
              <MessageSquare className="w-4 h-4 text-green-500" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            {template.subject && (
              <p className="text-sm text-gray-600">Subject: {template.subject}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
            <Badge 
              variant={template.source === 'system' ? 'default' : 'info'}
              className="text-xs"
            >
              {template.source === 'system' ? 'system' : 'user'}
            </Badge>
          </div>
          
          <span className="text-xs text-gray-400 w-24">
            {new Date(template.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewTemplate(template)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setEditingTemplate(template);
              setShowEditModal(true);
            }}
            disabled={template.source === 'system'}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {template.source !== 'system' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTemplateMutation.mutate(template.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  // Render collapsible section
  const renderCollapsibleSection = (
    title: string,
    icon: React.ReactNode,
    templates: Template[],
    isExpanded: boolean,
    setExpanded: (expanded: boolean) => void
  ) => {
    if (templates.length === 0) return null;

    return (
      <Collapsible open={isExpanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-3">
              {icon}
              <span className="font-semibold text-lg">{title}</span>
              <Badge variant="secondary" className="ml-2">
                {templates.length}
              </Badge>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {templates.map(renderTemplateItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Source Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={sourceFilter === 'system' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSourceFilter('system')}
            className="px-3"
          >
            System Generated
          </Button>
          <Button
            variant={sourceFilter === 'user' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSourceFilter('user')}
            className="px-3"
          >
            User Created
          </Button>
        </div>
        
        {/* Template Type Dropdown */}
        <div className="w-48">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white border shadow-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Display - Organized by Type and Source */}
      <div className="space-y-6">
        {/* Email Templates */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Email Templates
          </h2>
          
          {/* Email System Templates */}
          {sourceFilter === 'system' && renderCollapsibleSection(
            "System Generated",
            <Badge variant="default" className="text-xs">system</Badge>,
            emailSystem,
            emailSystemExpanded,
            setEmailSystemExpanded
          )}
          
          {/* Email User Templates */}
          {sourceFilter === 'user' && renderCollapsibleSection(
            "User Created",
            <Badge variant="info" className="text-xs">user</Badge>,
            emailUser,
            emailUserExpanded,
            setEmailUserExpanded
          )}
        </div>

        {/* SMS Templates */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            SMS Templates
          </h2>
          
          {/* SMS System Templates */}
          {sourceFilter === 'system' && renderCollapsibleSection(
            "System Generated", 
            <Badge variant="default" className="text-xs">system</Badge>,
            smsSystem,
            smsSystemExpanded,
            setSmsSystemExpanded
          )}
          
          {/* SMS User Templates */}
          {sourceFilter === 'user' && renderCollapsibleSection(
            "User Created",
            <Badge variant="info" className="text-xs">user</Badge>,
            smsUser,
            smsUserExpanded,
            setSmsUserExpanded
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl" aria-describedby="template-preview-description">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div id="template-preview-description" className="sr-only">
            Preview template content and details
          </div>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{previewTemplate.type}</Badge>
                <Badge variant="outline">{previewTemplate.category}</Badge>
              </div>
              {previewTemplate.subject && (
                <div>
                  <h4 className="font-medium mb-2">Subject:</h4>
                  <p className="text-gray-700">{previewTemplate.subject}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">Content:</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="whitespace-pre-wrap">{previewTemplate.content}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Template Modal */}
      <CreateTemplateModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      {/* Edit Template Modal */}
      <EditTemplateModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </div>
  );
};
