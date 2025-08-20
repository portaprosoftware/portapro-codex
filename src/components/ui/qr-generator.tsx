import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Printer } from 'lucide-react';

export const QRGenerator: React.FC = () => {
  const [qrValue, setQrValue] = useState('1232 • Standard Unit');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrElement = document.getElementById('qr-code');
      if (qrElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code Print</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  margin: 0;
                  flex-direction: column;
                }
                .qr-container {
                  text-align: center;
                  padding: 20px;
                }
                .qr-label {
                  margin-top: 10px;
                  font-size: 14px;
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                ${qrElement.outerHTML}
                <div class="qr-label">${qrValue}</div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="mb-4">
        <h4 className="text-base font-normal">Track Units with QR Codes Automatically</h4>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center space-y-4">
          <div id="qr-code" className="bg-white p-4 rounded border">
            <QRCodeSVG 
              value={qrValue} 
              size={128}
              level="M"
              includeMargin={true}
            />
          </div>
          <div className="text-center text-sm font-medium">
            {qrValue}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">QR Label</label>
            <Input
              value={qrValue}
              onChange={(e) => setQrValue(e.target.value)}
              placeholder="Enter unit identifier"
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => setQrValue(Math.floor(Math.random() * 9999) + ' • Standard Unit')}
              variant="outline"
              className="flex-1"
            >
              Generate
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Works offline — syncs later. Instant attach to units & jobs.
          </p>
        </div>
      </div>
    </div>
  );
};