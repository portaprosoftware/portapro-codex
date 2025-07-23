import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { QrCode, Mail, Bell, AlertTriangle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface QRFeedbackSettings {
  qr_feedback_email: string;
  qr_feedback_notifications_enabled: boolean;
}

export const QRFeedbackSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<QRFeedbackSettings>();

  // Query for current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings-qr-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('qr_feedback_email, qr_feedback_notifications_enabled')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Query for recent feedback
  const { data: recentFeedback } = useQuery({
    queryKey: ['recent-qr-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_feedback')
        .select(`
          *,
          product_items (
            item_code,
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: QRFeedbackSettings) => {
      const { error } = await supabase
        .from('company_settings')
        .update({
          qr_feedback_email: data.qr_feedback_email,
          qr_feedback_notifications_enabled: data.qr_feedback_notifications_enabled
        })
        .limit(1);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('QR feedback settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company-settings-qr-feedback'] });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  });

  // Reset form when settings load
  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = (data: QRFeedbackSettings) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>QR Code Feedback Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how customer QR scan feedback is handled
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Configuration */}
            <div>
              <Label htmlFor="qr_feedback_email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Notification Email Address</span>
              </Label>
              <Input
                id="qr_feedback_email"
                type="email"
                placeholder="support@company.com"
                {...register('qr_feedback_email')}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email address where QR feedback notifications will be sent
              </p>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <div>
                  <Label htmlFor="notifications">Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Send email alerts when customers submit feedback via QR codes
                  </p>
                </div>
              </div>
              <Switch
                id="notifications"
                {...register('qr_feedback_notifications_enabled')}
              />
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={!isDirty || updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How QR Feedback Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium">Customer Scans QR Code</h4>
                <p className="text-sm text-muted-foreground">
                  Each unit has a unique QR code that customers can scan with their phone
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium">Customer Submits Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  They can request assistance or leave comments with optional photos and contact info
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium">Instant Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You receive email alerts and in-app notifications with options to create jobs or schedule emergency service
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent QR Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFeedback && recentFeedback.length > 0 ? (
            <div className="space-y-3">
              {recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {feedback.feedback_type === 'assistance' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        Unit {feedback.product_items?.item_code || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {feedback.customer_message.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={feedback.feedback_type === 'assistance' ? 'destructive' : 'secondary'}
                    >
                      {feedback.feedback_type}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No QR feedback received yet</p>
              <p className="text-sm">Feedback will appear here when customers scan QR codes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};