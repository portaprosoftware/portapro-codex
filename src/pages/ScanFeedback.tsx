import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, MessageCircle, Upload, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ScanFeedback: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = useState<'assistance' | 'comment'>('assistance');
  const [message, setMessage] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get unit information
  const { data: unit, isLoading } = useQuery({
    queryKey: ['product-item', unitId],
    queryFn: async () => {
      if (!unitId) throw new Error('Unit ID is required');
      
      const { data, error } = await supabase
        .from('product_items')
        .select(`
          *,
          products (
            name
          )
        `)
        .eq('id', unitId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!unitId
  });

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!unitId || !message.trim()) {
        throw new Error('Please fill in all required fields');
      }

      let photoUrl = null;
      
      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${unitId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('qr-feedback-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) {
          console.error('Photo upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('qr-feedback-photos')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      // Submit feedback via edge function
      const { data, error } = await supabase.functions.invoke('qr-feedback-handler', {
        body: {
          unit_id: unitId,
          feedback_type: feedbackType,
          customer_message: message,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          photo_url: photoUrl
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Feedback submitted successfully!');
    },
    onError: (error) => {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading unit information...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unit Not Found</h2>
            <p className="text-muted-foreground">The QR code you scanned is not valid or the unit doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted and our team will respond promptly.
            </p>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Unit Feedback</CardTitle>
            <div className="text-center text-muted-foreground">
              <p className="font-medium">{unit.products?.name}</p>
              <p className="text-sm">Unit ID: {unit.item_code}</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Feedback Type Selection */}
            <div>
              <Label className="text-base font-medium">What can we help you with?</Label>
              <RadioGroup 
                value={feedbackType} 
                onValueChange={(value) => setFeedbackType(value as 'assistance' | 'comment')}
                className="mt-3"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="assistance" id="assistance" />
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <Label htmlFor="assistance" className="cursor-pointer">
                      Need Assistance (Urgent)
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="comment" id="comment" />
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <Label htmlFor="comment" className="cursor-pointer">
                      Leave a Comment
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-base font-medium">
                Message *
              </Label>
              <Textarea
                id="message"
                placeholder={feedbackType === 'assistance' 
                  ? "Please describe the issue you're experiencing..."
                  : "Share your feedback or comments..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2"
                rows={4}
                required
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <Label htmlFor="photo" className="text-base font-medium">
                Add Photo (Optional)
              </Label>
              <div className="mt-2">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label
                  htmlFor="photo"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {photoFile ? photoFile.name : 'Click to upload a photo'}
                    </p>
                  </div>
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={() => submitFeedback.mutate()}
              disabled={!message.trim() || submitFeedback.isPending}
              className="w-full"
              size="lg"
            >
              {submitFeedback.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                `Submit ${feedbackType === 'assistance' ? 'Assistance Request' : 'Feedback'}`
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By submitting this form, you acknowledge that your information will be used to respond to your request.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};