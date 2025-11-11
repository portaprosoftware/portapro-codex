import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { safeRead, safeInsert, safeUpdate, safeDelete } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { Plus, Edit, Trash2, Grid3x3, List, Image, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MarketingTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  preview_image_url?: string;
  updated_at: string;
  organization_id: string;
}

interface TemplateFormData {
  name: string;
  subject: string;
  content: string;
  category: string;
  preview_image_url?: string;
}

export default function TemplatesPage() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MarketingTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    content: '',
    category: 'General',
    preview_image_url: ''
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['marketing-templates', orgId],
    queryFn: async () => {
      const { data, error } = await safeRead('marketing_templates', orgId)
        .select('id, name, subject, content, category, preview_image_url, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingTemplate[];
    },
    enabled: !!orgId,
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!orgId) throw new Error('Organization context required');
      
      return await safeInsert('marketing_templates', {
        ...data,
        organization_id: orgId
      }, orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates', orgId] });
      toast.success('Template created successfully');
      handleCloseDrawer();
    },
    onError: () => {
      toast.error('Failed to create template');
    }
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      if (!orgId) throw new Error('Organization context required');
      
      return await safeUpdate('marketing_templates', data, orgId, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates', orgId] });
      toast.success('Template updated successfully');
      handleCloseDrawer();
    },
    onError: () => {
      toast.error('Failed to update template');
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('Organization context required');
      
      return await safeDelete('marketing_templates', orgId, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates', orgId] });
      toast.success('Template deleted successfully');
      setDeleteTemplateId(null);
    },
    onError: () => {
      toast.error('Failed to delete template');
    }
  });

  const handleOpenDrawer = (template?: MarketingTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        preview_image_url: template.preview_image_url || ''
      });
      setImagePreview(template.preview_image_url || null);
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: 'General',
        preview_image_url: ''
      });
      setImagePreview(null);
    }
    setUploadedImage(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: '',
      category: 'General',
      preview_image_url: ''
    });
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, preview_image_url: '' });
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!uploadedImage || !orgId) return null;

    setIsUploading(true);
    try {
      const fileExt = uploadedImage.name.split('.').pop();
      const fileName = `${orgId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('template-images')
        .upload(fileName, uploadedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      toast.error('Name and content are required');
      return;
    }

    // Upload image if a new one was selected
    let imageUrl = formData.preview_image_url;
    if (uploadedImage) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const templateData = {
      ...formData,
      preview_image_url: imageUrl
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTemplateId(id);
  };

  const confirmDelete = () => {
    if (deleteTemplateId) {
      deleteMutation.mutate(deleteTemplateId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Templates Display */}
      {templates.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl shadow-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">No templates yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first template to get started
              </p>
              <Button onClick={() => handleOpenDrawer()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl shadow-md">
          {/* Header inside card */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold font-inter">Templates Library</h2>
                <p className="text-sm text-muted-foreground">
                  Create and manage email templates for campaigns
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={() => handleOpenDrawer()}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={viewMode === 'list' ? '' : 'p-6'}>
            {viewMode === 'list' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          {template.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(template.updated_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDrawer(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4 space-y-3">
                    {template.preview_image_url ? (
                      <div className="aspect-video bg-muted rounded overflow-hidden">
                        <img
                          src={template.preview_image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold truncate">{template.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {template.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDrawer(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Template Form Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[95vh] md:h-screen">
          <div className="mx-auto w-full max-w-5xl h-full flex flex-col">
            <DrawerHeader className="border-b">
              <DrawerTitle className="text-xl">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to our service!"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Promotion">Promotion</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter your email content here..."
                    rows={10}
                  />
                </div>

                <div>
                  <Label htmlFor="preview_image">Preview Image</Label>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative">
                        <div className="aspect-video bg-muted rounded overflow-hidden border-2 border-border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <Label
                          htmlFor="image-upload"
                          className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
                        >
                          Click to upload an image
                        </Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-6">
              <div className="flex gap-3 max-w-3xl mx-auto">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseDrawer}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold"
                  onClick={handleSave}
                  disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                >
                  {isUploading 
                    ? 'Uploading...' 
                    : createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingTemplate
                    ? 'Update'
                    : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={!!deleteTemplateId}
        onClose={() => setDeleteTemplateId(null)}
        onConfirm={confirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
      />
    </div>
  );
}
