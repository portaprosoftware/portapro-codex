import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Trash2, Eye, ArrowLeft, Upload, X, Image } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ButtonBuilder } from './ButtonBuilder';
import { SavedButtons } from './SavedButtons';
import { useQuery } from '@tanstack/react-query';

interface CustomButton {
  id: string;
  text: string;
  type: 'url' | 'phone' | 'email';
  value: string;
  style: 'primary' | 'secondary';
  includeEmoji?: boolean;
}

interface MessageData {
  subject?: string;
  content: string;
  buttons: CustomButton[];
  customImageUrl?: string;
  imagePosition?: 'top' | 'middle' | 'bottom' | 'left';
  showCompanyLogo?: boolean;
  logoSize?: 'small' | 'medium' | 'large';
}

interface MessageComposerProps {
  campaignType: 'email' | 'sms' | 'both';
  onSave: (messageData: MessageData) => void;
  onBack: () => void;
  initialData?: MessageData;
}

const EMAIL_TYPES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'custom', label: 'Custom' },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'casual', label: 'Casual' },
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  campaignType,
  onSave,
  onBack,
  initialData
}) => {
  const [messageData, setMessageData] = useState<MessageData>(
    initialData || {
      subject: '',
      content: '',
      buttons: [],
      customImageUrl: '',
      imagePosition: 'bottom',
      showCompanyLogo: true,
      logoSize: 'medium'
    }
  );
  
  const [hasGeneratedWithAI, setHasGeneratedWithAI] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{subject?: string, content: string} | null>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);

  const [logoDimensions, setLogoDimensions] = useState<{width: number, height: number} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiParams, setAiParams] = useState({
    emailType: '',
    tone: '',
    customInstructions: ''
  });

  // Fetch company logo from settings
  const { data: companySettings } = useQuery({
    queryKey: ['company-logo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_logo, company_name, default_logo_in_marketing')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const handleAIGenerate = async () => {
    if (!aiParams.tone) {
      toast({ title: 'Please select a tone', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          type: campaignType === 'both' ? 'email' : campaignType,
          emailType: aiParams.emailType || undefined,
          tone: aiParams.tone,
          customInstructions: aiParams.customInstructions || undefined,
          includeSubject: campaignType !== 'sms'
        }
      });

      if (error) throw error;

      // Store generated content for preview instead of directly adding it
      setAiGeneratedContent({
        subject: data.subject,
        content: data.content
      });
      
      // Show preview modal for approval
      setShowAIPreview(true);
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ 
        title: 'Failed to generate content', 
        description: 'Please try again or create manually',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseAIContent = () => {
    if (!aiGeneratedContent) return;
    
    setMessageData(prev => ({
      ...prev,
      subject: aiGeneratedContent.subject || prev.subject,
      content: aiGeneratedContent.content
    }));
    
    setHasGeneratedWithAI(true);
    setShowAIPreview(false);
    
    // Scroll to content area and add visual feedback
    const contentElement = document.getElementById('content');
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      contentElement.style.border = '2px solid #10b981';
      setTimeout(() => {
        contentElement.style.border = '';
      }, 2000);
    }
  };

  const handleTryAgain = () => {
    setShowAIPreview(false);
    setAiGeneratedContent(null);
  };

  const addButton = (button: CustomButton) => {
    setMessageData(prev => ({
      ...prev,
      buttons: [...prev.buttons, button]
    }));
  };

  const updateButton = (id: string, updates: Partial<CustomButton>) => {
    setMessageData(prev => ({
      ...prev,
      buttons: prev.buttons.map(btn => 
        btn.id === id ? { ...btn, ...updates } : btn
      )
    }));
  };

  const removeButton = (id: string) => {
    setMessageData(prev => ({
      ...prev,
      buttons: prev.buttons.filter(btn => btn.id !== id)
    }));
  };

  const handleSave = () => {
    if (!messageData.content.trim()) {
      toast({ title: 'Please add message content', variant: 'destructive' });
      return;
    }

    if (campaignType !== 'sms' && !messageData.subject?.trim()) {
      toast({ title: 'Please add a subject line', variant: 'destructive' });
      return;
    }

    onSave(messageData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please select an image under 5MB', variant: 'destructive' });
      return;
    }

    try {
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = async () => {
        // Calculate new dimensions (max width 600px)
        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const fileName = `message-image-${Date.now()}.jpg`;
          const { data, error } = await supabase.storage
            .from('message-images')
            .upload(fileName, blob);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('message-images')
            .getPublicUrl(fileName);

          setMessageData(prev => ({ ...prev, customImageUrl: publicUrl }));
          toast({ title: 'Image uploaded successfully!' });
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    }
  };

  const removeImage = () => {
    setMessageData(prev => ({ ...prev, customImageUrl: '' }));
  };

  const getButtonIcon = (type: string, includeEmoji = true) => {
    if (!includeEmoji) return '';
    switch (type) {
      case 'phone': return '📞';
      case 'email': return '✉️';
      case 'url': return '🔗';
      default: return '🔗';
    }
  };

  const renderContentWithImage = (content: string, imageUrl?: string, position?: string) => {
    if (!imageUrl) return content;
    
    const imageElement = (
      <img 
        src={imageUrl} 
        alt="Custom message image" 
        className={position === 'left' ? "w-32 h-auto rounded border mr-4 float-left" : "max-w-full h-auto rounded border my-2"}
        style={{ maxHeight: '200px' }}
      />
    );

    switch (position) {
      case 'top':
        return (
          <div>
            {imageElement}
            <p className="whitespace-pre-wrap text-sm">{content}</p>
          </div>
        );
      case 'middle':
        const words = content.split(' ');
        const midPoint = Math.floor(words.length / 2);
        const firstHalf = words.slice(0, midPoint).join(' ');
        const secondHalf = words.slice(midPoint).join(' ');
        return (
          <div>
            <p className="whitespace-pre-wrap text-sm">{firstHalf}</p>
            {imageElement}
            <p className="whitespace-pre-wrap text-sm">{secondHalf}</p>
          </div>
        );
      case 'left':
        return (
          <div className="overflow-hidden">
            {imageElement}
            <p className="whitespace-pre-wrap text-sm">{content}</p>
            <div className="clear-both"></div>
          </div>
        );
      case 'bottom':
      default:
        return (
          <div>
            <p className="whitespace-pre-wrap text-sm">{content}</p>
            {imageElement}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <h2 className="text-xl font-semibold font-inter">Create Your Message</h2>
      </div>

      <div className="space-y-4 lg:space-y-6">
        {/* Message Composer */}
        <div className="space-y-4 lg:space-y-6">
          <Card className="p-4 lg:p-6">
            <h3 className="text-lg font-semibold mb-4 font-inter">AI Assistant</h3>
            
            <div className="space-y-3 lg:space-y-4">
              {campaignType !== 'sms' && (
                <div>
                  <Label>Email Type</Label>
                  <Select value={aiParams.emailType} onValueChange={(value) => setAiParams(prev => ({ ...prev, emailType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Tone</Label>
                <Select value={aiParams.tone} onValueChange={(value) => setAiParams(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(tone => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Instructions *</Label>
                <Textarea
                  placeholder="Add basic context for a friendly marketing message or status update about anything"
                  value={aiParams.customInstructions}
                  onChange={(e) => setAiParams(prev => ({ ...prev, customInstructions: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAIGenerate}
                disabled={!aiParams.tone || !aiParams.customInstructions.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-inter">Message Content</h3>
              {/* Company Logo Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCompanyLogo"
                  checked={messageData.showCompanyLogo}
                  onCheckedChange={(checked) => setMessageData(prev => ({ ...prev, showCompanyLogo: !!checked }))}
                />
                <Label htmlFor="showCompanyLogo" className="text-sm">
                  Include company logo
                </Label>
              </div>
            </div>

            {/* Logo Size Control */}
            {messageData.showCompanyLogo && (
              <div className="mb-4">
                <Label>Logo Size</Label>
                <div className="flex items-center gap-3">
                  <Select 
                    value={messageData.logoSize || 'medium'} 
                    onValueChange={(value: 'small' | 'medium' | 'large') => 
                      setMessageData(prev => ({ ...prev, logoSize: value }))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Logo Size Warning */}
                  {logoDimensions && (() => {
                    const getTargetSize = (size?: string) => {
                      switch (size) {
                        case 'small': return 48; // h-12 = 48px
                        case 'large': return 80; // h-20 = 80px  
                        default: return 64; // h-16 = 64px
                      }
                    };
                    
                    const targetHeight = getTargetSize(messageData.logoSize);
                    const naturalHeight = logoDimensions.height;
                    
                    if (targetHeight > naturalHeight * 1.5) {
                      return (
                        <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          ⚠️ Logo may appear blurry at this size. Try smaller size.
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
            
            <div className="space-y-3 lg:space-y-4">
              {campaignType !== 'sms' && (
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={messageData.subject}
                    onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={messageData.content}
                  onChange={(e) => setMessageData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={campaignType === 'sms' ? 'Enter SMS message (keep it concise)' : 'Enter email content'}
                  rows={campaignType === 'sms' ? 4 : 8}
                />
                {campaignType === 'sms' && (
                  <p className="text-sm text-gray-500 mt-1">
                    {messageData.content.length}/160 characters
                  </p>
                )}
              </div>

              {/* Custom Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Custom Image (Optional)</Label>
                  {messageData.customImageUrl && (
                    <Button
                      onClick={removeImage}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                
                {messageData.customImageUrl ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={messageData.customImageUrl} 
                        alt="Custom message image" 
                        className="w-full max-w-sm rounded-lg border"
                      />
                    </div>
                    
              {/* Image Position Control */}
                    <div>
                      <Label>Image Position</Label>
                      <Select 
                        value={messageData.imagePosition || 'bottom'} 
                        onValueChange={(value: 'top' | 'middle' | 'bottom' | 'left') => 
                          setMessageData(prev => ({ ...prev, imagePosition: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top of message</SelectItem>
                          <SelectItem value="middle">Middle of message</SelectItem>
                          <SelectItem value="bottom">Bottom of message</SelectItem>
                          <SelectItem value="left">Left (with text wrap)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload an image
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          Max 5MB, will be resized to fit inline
                        </span>
                      </div>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 font-inter">Action Buttons</h3>

            <div className="space-y-4">
              {/* Button Builder */}
              <ButtonBuilder onAddButton={addButton} />

              {/* Existing Buttons */}
              {messageData.buttons.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium font-inter">Added Buttons</h4>
                  {messageData.buttons.map((button) => (
                    <div key={button.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Button {messageData.buttons.indexOf(button) + 1}</span>
                        <Button
                          onClick={() => removeButton(button.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={button.text}
                            onChange={(e) => updateButton(button.id, { text: e.target.value })}
                            placeholder="e.g., Call Now"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select value={button.type} onValueChange={(value: any) => updateButton(button.id, { type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="url">Website URL</SelectItem>
                              <SelectItem value="phone">Phone Number</SelectItem>
                              <SelectItem value="email">Email Address</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>
                          {button.type === 'url' ? 'URL' : 
                           button.type === 'phone' ? 'Phone Number' : 'Email Address'}
                        </Label>
                        <Input
                          value={button.value}
                          onChange={(e) => updateButton(button.id, { value: e.target.value })}
                          placeholder={
                            button.type === 'url' ? 'https://example.com' :
                            button.type === 'phone' ? '(555) 123-4567' : 'contact@example.com'
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`emoji-${button.id}`}
                          checked={button.includeEmoji !== false}
                          onCheckedChange={(checked) => updateButton(button.id, { includeEmoji: !!checked })}
                        />
                        <Label htmlFor={`emoji-${button.id}`} className="text-sm">
                          Include emoji {getButtonIcon(button.type)}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Preview */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold font-inter">Preview</h3>
            <Button onClick={() => setShowPreview(true)} variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Full Preview
            </Button>
          </div>

          <div className="space-y-3 lg:space-y-4">
            {/* Company Logo Preview */}
            {messageData.showCompanyLogo && companySettings?.company_logo && (() => {
              const getLogoHeight = (size?: string) => {
                switch (size) {
                  case 'small': return 'h-8';
                  case 'large': return 'h-16';
                  default: return 'h-12';
                }
              };

              return (
                <div>
                  <Label className="text-sm text-gray-500">Company Logo</Label>
                  <div className="mt-1">
                    <img 
                      src={companySettings.company_logo} 
                      alt={companySettings.company_name || 'Company logo'} 
                      className={`${getLogoHeight(messageData.logoSize)} w-auto object-contain`}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        setLogoDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                      }}
                    />
                  </div>
                </div>
              );
            })()}

            {campaignType !== 'sms' && messageData.subject && (
              <div>
                <Label className="text-sm text-gray-500">Subject</Label>
                <p className="font-medium">{messageData.subject}</p>
              </div>
            )}

            {messageData.content && (
              <div>
                <Label className="text-sm text-gray-500">Content</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {renderContentWithImage(messageData.content, messageData.customImageUrl, messageData.imagePosition)}
                </div>
              </div>
            )}

            {messageData.buttons.length > 0 && (
              <div>
                <Label className="text-sm text-gray-500">Action Buttons</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {messageData.buttons.map((button) => (
                    <Badge key={button.id} variant="secondary" className="flex items-center gap-1">
                      {button.includeEmoji !== false && <span>{getButtonIcon(button.type)}</span>}
                      {button.text || 'Untitled Button'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Saved Buttons */}
        <SavedButtons onSelectButton={addButton} />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {hasGeneratedWithAI && (
            <Button onClick={handleSave} className="flex-1">
              Use This Message
            </Button>
          )}
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pb-4">
            {campaignType !== 'sms' && messageData.subject && (
              <div>
                <Label>Subject Line</Label>
                <p className="text-lg font-semibold">{messageData.subject}</p>
              </div>
            )}

            <div>
              <Label>Message Content</Label>
              <div className="p-4 border rounded-lg bg-white">
                {/* Company Logo in Full Preview */}
                {messageData.showCompanyLogo && companySettings?.company_logo && (() => {
                  const getLogoHeightFull = (size?: string) => {
                    switch (size) {
                      case 'small': return 'h-12';
                      case 'large': return 'h-20';
                      default: return 'h-16';
                    }
                  };

                  return (
                    <div className="mb-4">
                      <img 
                        src={companySettings.company_logo} 
                        alt={companySettings.company_name || 'Company logo'} 
                        className={`${getLogoHeightFull(messageData.logoSize)} w-auto object-contain`}
                      />
                    </div>
                  );
                })()}
                
                {/* Render content with positioned image */}
                <div>
                  {messageData.customImageUrl ? (
                    (() => {
                      const imageElement = (
                        <img 
                          src={messageData.customImageUrl} 
                          alt="Custom message image" 
                          className="max-w-full h-auto rounded border my-4"
                          style={{ maxHeight: '400px' }}
                        />
                      );

                      switch (messageData.imagePosition) {
                        case 'top':
                          return (
                            <div>
                              {imageElement}
                              <p className="whitespace-pre-wrap">{messageData.content}</p>
                            </div>
                          );
                        case 'middle':
                          const words = messageData.content.split(' ');
                          const midPoint = Math.floor(words.length / 2);
                          const firstHalf = words.slice(0, midPoint).join(' ');
                          const secondHalf = words.slice(midPoint).join(' ');
                          return (
                            <div>
                              <p className="whitespace-pre-wrap">{firstHalf}</p>
                              {imageElement}
                              <p className="whitespace-pre-wrap">{secondHalf}</p>
                            </div>
                          );
                        case 'left':
                          return (
                            <div className="overflow-hidden">
                              <img 
                                src={messageData.customImageUrl} 
                                alt="Custom message image" 
                                className="w-32 h-auto rounded border mr-4 float-left"
                                style={{ maxHeight: '200px' }}
                              />
                              <p className="whitespace-pre-wrap">{messageData.content}</p>
                              <div className="clear-both"></div>
                            </div>
                          );
                        case 'bottom':
                        default:
                          return (
                            <div>
                              <p className="whitespace-pre-wrap">{messageData.content}</p>
                              {imageElement}
                            </div>
                          );
                      }
                    })()
                  ) : (
                    <p className="whitespace-pre-wrap">{messageData.content}</p>
                  )}
                </div>
                
                {messageData.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {messageData.buttons.map((button) => (
                      <Button key={button.id} size="sm" variant={button.style === 'primary' ? 'default' : 'outline'}>
                        {button.includeEmoji !== false && getButtonIcon(button.type)} {button.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Content Preview Modal */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Generated Content Preview</DialogTitle>
          </DialogHeader>
          
          {aiGeneratedContent && (
            <div className="space-y-4 pb-4">
              {/* Overwrite Warning */}
              {(messageData.content.trim() || messageData.subject?.trim()) && (
                <div className="p-3 bg-white border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-medium text-sm">⚠️ Warning:</span>
                    <p className="text-sm text-amber-700">
                      Using this content will replace your current {messageData.content.trim() && messageData.subject?.trim() ? 'subject and message content' : messageData.content.trim() ? 'message content' : 'subject line'}.
                    </p>
                  </div>
                </div>
              )}

              {campaignType !== 'sms' && aiGeneratedContent.subject && (
                <div>
                  <Label>Generated Subject Line</Label>
                  <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="font-semibold text-gray-900">{aiGeneratedContent.subject}</p>
                  </div>
                </div>
              )}

              <div>
                <Label>Generated Content</Label>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="whitespace-pre-wrap text-gray-900">{aiGeneratedContent.content}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleUseAIContent} className="flex-1">
                  Use This Content
                </Button>
                <Button onClick={handleTryAgain} variant="outline" className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};