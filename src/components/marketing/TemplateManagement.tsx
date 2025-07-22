
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Eye, Edit, Trash2, Mail, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesType = selectedType === 'all' || template.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ['all', ...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === 'all' ? 'All Categories' : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All Types</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {template.type === 'email' ? (
                  <Mail className="w-4 h-4 text-blue-500" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-green-500" />
                )}
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <Badge 
                variant={template.source === 'system' ? 'default' : 'outline'}
                className="text-xs"
              >
                {template.source}
              </Badge>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
            {template.subject && (
              <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
            )}
            <p className="text-sm text-gray-500 mb-4 line-clamp-3">
              {template.content.substring(0, 100)}...
            </p>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {new Date(template.created_at).toLocaleDateString()}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
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
        ))}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
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
    </div>
  );
};
