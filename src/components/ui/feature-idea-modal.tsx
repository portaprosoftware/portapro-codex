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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeatureIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureIdeaModal({ isOpen, onClose }: FeatureIdeaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide both a title and description for your feature idea.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-feature-idea', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Feature idea submitted!",
        description: "Thank you for your suggestion. We'll review it carefully.",
      });

      setFormData({
        title: '',
        content: '',
        firstName: '',
        lastName: '',
        company: '',
        phone: '',
        email: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting feature idea:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Feature Idea</DialogTitle>
          <DialogDescription>
            Share your ideas to help shape the future of PortaPro
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Feature Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title for your feature idea"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Describe your feature idea in detail..."
                className="min-h-[120px]"
                required
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Contact Information (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Company</label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Phone Number</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  type="tel"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  type="email"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feature Idea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
