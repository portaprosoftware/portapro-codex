import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function PaymentCanceled() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');

  useEffect(() => {
    // Show canceled message
    toast.info('Payment canceled', {
      description: 'Your payment was not completed. You can try again anytime.',
    });

    // Redirect to invoices page after a short delay
    const timer = setTimeout(() => {
      navigate('/invoices');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return null;
}
