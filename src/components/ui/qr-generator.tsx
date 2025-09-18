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
    <div className="border rounded-lg p-5 bg-card">
      <div className="mb-3">
        <h4 className="text-sm font-normal text-center">Track Units with QR Codes Automatically</h4>
      </div>
      
      <div className="grid md:grid-cols-2 gap-2 items-center">
        <div className="flex flex-col items-center">
          <div id="qr-code" className="bg-white p-2 rounded border">
            <QRCodeSVG 
              value={qrValue} 
              size={141}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium mb-1">QR Label</label>
              <Input
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder="Enter unit identifier"
                className="w-full text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setQrValue(Math.floor(Math.random() * 9999) + ' • Standard Unit')}
                variant="outline"
                className="flex-1 text-xs py-1"
              >
                Generate
              </Button>
              <Button 
                onClick={handlePrint}
                variant="outline"
                className="flex-1 text-xs py-1"
              >
                <Printer className="w-3 h-3 mr-1" />
                Print
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Works offline — syncs later. Instant attach to units & jobs.
          </p>
        </div>
      </div>
    </div>
  );
};