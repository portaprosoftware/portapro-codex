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
  productName?: string;
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
  productName,
  items
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
    setShowPrintPreview(true);
  };

  const getSelectedItemsData = () => {
    return sortedItems.filter(item => selectedItems.includes(item.id));
  };

  const printQRCodes = () => {
    window.print();
  };

  if (showPrintPreview) {
    const selectedItemsData = getSelectedItemsData();
    const pages = [];
    
    // Group items into pages of 9
    for (let i = 0; i < selectedItemsData.length; i += 9) {
      pages.push(selectedItemsData.slice(i, i + 9));
    }

    return (
      <>
        {/* Screen Preview UI */}
        <Dialog open={open} onOpenChange={() => {
          setShowPrintPreview(false);
          onClose();
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto screen-only">
            <DialogHeader>
              <DialogTitle>
                Print Preview - {selectedItemsData.length} QR Codes
                {productName && <div className="text-sm font-normal text-gray-600 mt-1">QR codes for {productName}</div>}
                <div className="text-xs text-gray-500 mt-1">
                  Select Print QR Codes to view size on 8.5 x 11 sheet
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={printQRCodes} className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  Print QR Codes
                </Button>
                <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                  Back to Selection
                </Button>
              </div>

              {/* Preview Layout */}
              {pages.map((pageItems, pageIndex) => (
                <div key={pageIndex} className="preview-page">
                  {pageItems.map((item) => (
                    <div key={item.id} className="preview-item">
                      <QRCodeSVG
                        value={item.qr_code_data || item.item_code}
                        size={140}
                        level="M"
                        includeMargin
                      />
                      <div className="text-base font-bold mt-1 text-center">
                        {item.item_code}
                      </div>
                    </div>
                  ))}
                  {/* Fill empty cells if less than 9 items on last page */}
                  {pageItems.length < 9 && Array.from({ length: 9 - pageItems.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="preview-item border-dashed opacity-30" />
                  ))}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Print-Only Content */}
        <div className="print-only" style={{ display: 'none' }}>
          {pages.map((pageItems, pageIndex) => (
            <div key={`print-${pageIndex}`} className="print-page">
              {pageItems.map((item) => (
                <div key={`print-${item.id}`} className="qr-print-item">
                  <QRCodeSVG
                    value={item.qr_code_data || item.item_code}
                    size={200}
                    level="M"
                    includeMargin
                  />
                  <div className="qr-print-text">
                    {item.item_code}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .screen-only {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            .print-page {
              width: 8.5in;
              height: 11in;
              padding: 0.25in;
              page-break-after: always;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(3, 1fr);
              gap: 0.1in;
              margin: 0;
            }
            .print-page:last-child {
              page-break-after: avoid;
            }
            .qr-print-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #333;
              padding: 0.05in;
              box-sizing: border-box;
            }
            .qr-print-text {
              font-family: Arial, sans-serif;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin-top: 0.05in;
              color: #000;
            }
            @page {
              margin: 0;
              size: letter portrait;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          
          .preview-page {
            border: 2px solid #e5e7eb;
            margin: 1rem 0;
            background: white;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 0.5rem;
            padding: 1rem;
            aspect-ratio: 8.5/11;
            max-width: 600px;
          }
          .preview-item {
            border: 1px solid #d1d5db;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            background: #f9fafb;
          }
        `}} />
      </>
    );
  }

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
                  <div className="w-16 h-16 border rounded p-1">
                    <QRCodeSVG
                      value={item.qr_code_data || item.item_code}
                      size={56}
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
              Preview & Print ({selectedItems.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};