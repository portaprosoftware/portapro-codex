import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Consumable {
  id: string;
  name: string;
  sku?: string;
  category: string;
}

export const ConsumableQRGenerator: React.FC = () => {
  const [selectedConsumable, setSelectedConsumable] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');

  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-qr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('id, name, sku, category')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as unknown as Consumable[];
    }
  });

  const generateQRCode = () => {
    if (!selectedConsumable) {
      toast.error('Please select a consumable');
      return;
    }

    const consumable = consumables?.find(c => c.id === selectedConsumable);
    if (!consumable) return;

    // Generate QR data with request URL
    const baseUrl = window.location.origin;
    const qrContent = `${baseUrl}/consumable-request/${consumable.id}`;
    setQrData(qrContent);
    
    toast.success('QR code generated successfully');
  };

  const downloadQR = () => {
    if (!qrData) return;
    
    const consumable = consumables?.find(c => c.id === selectedConsumable);
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${consumable?.name || 'consumable'}-qr.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Consumable</label>
            <Select value={selectedConsumable} onValueChange={setSelectedConsumable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a consumable" />
              </SelectTrigger>
              <SelectContent>
                {consumables?.map(consumable => (
                  <SelectItem key={consumable.id} value={consumable.id}>
                    {consumable.name} {consumable.sku && `(${consumable.sku})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button onClick={generateQRCode} disabled={!selectedConsumable}>
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR Code
            </Button>
          </div>

          {qrData && (
            <div className="border rounded-lg p-4 text-center space-y-4">
              <div className="flex justify-center">
                <div 
                  id="qr-display"
                  className="w-48 h-48 border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-white"
                >
                  <span className="text-xs text-muted-foreground">QR Code: {qrData}</span>
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={downloadQR}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Field staff can scan this QR code to request this consumable
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};