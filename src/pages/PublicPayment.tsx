import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicPayment() {
  const { paymentLinkId } = useParams<{ paymentLinkId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentLink = async () => {
      if (!paymentLinkId) {
        setError('Invalid payment link');
        setLoading(false);
        return;
      }

      try {
        // In a real implementation, you would:
        // 1. Verify the payment link ID exists in your database
        // 2. Get the Stripe payment link URL
        // 3. Redirect to Stripe's hosted payment page
        
        // For now, show a message
        toast.info('Redirecting to secure payment page...');
        
        // Simulate redirect
        setTimeout(() => {
          setError('Payment link integration pending. Please contact support.');
          setLoading(false);
        }, 1000);
        
      } catch (err: any) {
        console.error('Error processing payment link:', err);
        setError(err.message || 'Failed to process payment link');
        setLoading(false);
      }
    };

    handlePaymentLink();
  }, [paymentLinkId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing payment link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Payment Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{error}</p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
