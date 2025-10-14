import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';

export default function PaymentSuccess() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Thank you for your payment. Your transaction has been completed successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>

          {paymentId && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Payment Reference</p>
              <p className="text-sm font-mono">{paymentId}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => navigate('/')}
              className="w-full"
              size="lg"
            >
              Return Home
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
