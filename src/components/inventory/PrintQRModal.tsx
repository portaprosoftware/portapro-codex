import React, { useState } from "react";
import { Printer, Check, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface PrintQRModalProps {
  open: boolean;
  onClose: () => void;
  items: Array<{
    id: string;
    item_code: string;
    qr_code_data?: string | null;
    created_at?: string;
  }>;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({
  open,
  onClose,
  items
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Sort items chronologically
  const sortedItems = [...items].sort((a, b) => 
    new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  const handleSelectAll = () => {
    if (selectedItems.length === sortedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedItems.map(item => item.id));
    }
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to print");
      return;
    }
    
    // Create the print content and trigger browser print directly
    const selectedItemsData = sortedItems.filter(item => selectedItems.includes(item.id));
    const pages = [];
    
    // Group items into pages of 9
    for (let i = 0; i < selectedItemsData.length; i += 9) {
      pages.push(selectedItemsData.slice(i, i + 9));
    }

    // Create hidden print content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Codes Print</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .print-page {
                width: 8.5in;
                height: 11in;
                padding: 0.5in;
                page-break-after: always;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 0.2in;
              }
              .print-page:last-child {
                page-break-after: avoid;
              }
              .qr-print-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border: 1px solid #ddd;
                padding: 0.1in;
              }
              .qr-print-text {
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                margin-top: 0.1in;
              }
              @page {
                margin: 0;
                size: letter portrait;
              }
            }
            @media screen {
              body {
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .print-page {
                border: 2px solid #e5e7eb;
                margin: 1rem 0;
                background: white;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 0.5rem;
                padding: 1rem;
                width: 8.5in;
                height: 11in;
              }
              .qr-print-item {
                border: 1px solid #d1d5db;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
                background: #f9fafb;
              }
              .qr-print-text {
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                margin-top: 8px;
              }
            }
          </style>
          <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
        </head>
        <body>
          ${pages.map((pageItems, pageIndex) => `
            <div class="print-page">
              ${pageItems.map((item) => `
                <div class="qr-print-item">
                  <canvas id="qr-${item.id}" width="150" height="150"></canvas>
                  <div class="qr-print-text">${item.item_code}</div>
                </div>
              `).join('')}
              ${pageItems.length < 9 ? Array.from({ length: 9 - pageItems.length }).map((_, index) => `
                <div class="qr-print-item" style="border-style: dashed; opacity: 0.3;"></div>
              `).join('') : ''}
            </div>
          `).join('')}
          
          <script>
            // Generate QR codes after page loads
            window.onload = function() {
              ${selectedItemsData.map((item) => `
                QRCode.toCanvas(document.getElementById('qr-${item.id}'), '${item.qr_code_data || item.item_code}', {
                  width: 150,
                  margin: 2
                });
              `).join('')}
              
              // Auto-print after QR codes are generated
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select QR Codes to Print</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedItems.length === sortedItems.length ? (
                <Check className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedItems.length === sortedItems.length ? "Deselect All" : "Select All"}
            </Button>
            <span className="text-sm text-gray-600">
              {selectedItems.length} of {sortedItems.length} selected
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="space-y-2 p-4">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleItemToggle(item.id)}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{item.item_code}</span>
                  </div>
                  <div className="w-8 h-8 border rounded">
                    <QRCodeSVG
                      value={item.qr_code_data || item.item_code}
                      size={32}
                      level="M"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print ({selectedItems.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};