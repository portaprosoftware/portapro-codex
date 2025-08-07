import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string; // Optional productId to filter QR codes for a specific product
}

interface ProductItem {
  id: string;
  tool_number: string;
  item_code: string;
  qr_code_data: string | null;
  created_at: string;
  products: {
    name: string;
  };
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({ isOpen, onClose, productId }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch product items with QR code data, optionally filtered by productId
  const { data: productItems, isLoading } = useQuery({
    queryKey: ['product-items-qr', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_items')
        .select(`
          id,
          tool_number,
          item_code,
          qr_code_data,
          created_at,
          products!inner(name)
        `)
        .not('item_code', 'is', null);

      // If productId is provided, filter by that specific product
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data as ProductItem[];
    },
    enabled: isOpen,
  });

  const items = productItems || [];

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handlePrint = () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));
    
    // Generate QR codes in batches of 6
    const qrCodeBatches = [];
    for (let i = 0; i < selectedItemsData.length; i += 6) {
      qrCodeBatches.push(selectedItemsData.slice(i, i + 6));
    }

    // Generate QR code data URLs for all selected items
    const qrCodeDataUrls: Record<string, string> = {};
    selectedItemsData.forEach(item => {
      // Create a temporary canvas to generate QR code as data URL
      const canvas = document.createElement('canvas');
      const size = 180; // Increased from 120 to 180 (1.5x larger)
      canvas.width = size;
      canvas.height = size;
      
      // Create temporary container for QR code
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      try {
        // Create QR code using React component temporarily
        const qrData = item.qr_code_data || item.item_code;
        const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">${generateQRCodeSVG(qrData)}</svg>`;
        qrCodeDataUrls[item.id] = qrSvg;
      } finally {
        document.body.removeChild(tempDiv);
      }
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - Print</title>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0.5in;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .page {
              width: 100%;
              height: 100vh;
              display: flex;
              flex-direction: column;
              page-break-after: always;
              padding: 20px;
              box-sizing: border-box;
            }
            
            .page:last-child {
              page-break-after: avoid;
            }
            
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(3, 1fr);
              gap: 20px;
              height: 100%;
            }
            
            .qr-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
              background: white;
            }
            
            .qr-code {
              margin-bottom: 12px;
            }
            
            .qr-info {
              width: 100%;
            }
            
            .tool-number {
              font-size: 16px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
              word-break: break-all;
            }
            
            .item-code {
              font-size: 14px;
              font-weight: 500;
              color: #374151;
              margin-bottom: 4px;
              word-break: break-all;
            }
            
            .product-name {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 4px;
              line-height: 1.2;
            }
            
            @media print {
              .page {
                height: 100vh;
                page-break-after: always;
              }
              
              .page:last-child {
                page-break-after: avoid;
              }
            }
          </style>
          <script src="https://unpkg.com/qrcode-generator@1.4.4/qrcode.js"></script>
        </head>
        <body>
          ${qrCodeBatches.map(batch => `
            <div class="page">
              <div class="qr-grid">
                ${batch.map(item => `
                  <div class="qr-item">
                    <div class="qr-code">
                      <canvas id="qr-${item.id}" width="180" height="180"></canvas>
                    </div>
                    <div class="qr-info">
                      <div class="tool-number">${item.tool_number}</div>
                      <div class="item-code">${item.item_code}</div>
                      <div class="product-name">${item.products.name}</div>
                    </div>
                  </div>
                `).join('')}
                ${batch.length < 6 ? Array(6 - batch.length).fill('<div class="qr-item" style="visibility: hidden;"></div>').join('') : ''}
              </div>
            </div>
          `).join('')}
          
          <script>
            window.onload = function() {
              ${selectedItemsData.map(item => `
                try {
                  var qr = qrcode(0, 'M');
                  var qrData = '${item.qr_code_data || item.item_code}';
                  qr.addData(qrData);
                  qr.make();
                  
                  var canvas = document.getElementById('qr-${item.id}');
                  if (canvas) {
                    var ctx = canvas.getContext('2d');
                    var moduleCount = qr.getModuleCount();
                    var cellSize = 180 / moduleCount; // Updated to use 180 instead of 120
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, 180, 180); // Updated to use 180 instead of 120
                    
                    ctx.fillStyle = '#000000';
                    for (var row = 0; row < moduleCount; row++) {
                      for (var col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error generating QR code for ${item.tool_number}:', e);
                }
              `).join('\n')}
              
              // Print after QR codes are generated
              setTimeout(() => {
                window.print();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    // Create print window and write content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    onClose();
  };

  // Helper function to generate QR code SVG using the qrcode.react library approach
  const generateQRCodeSVG = (value: string) => {
    // Create a temporary container to render the QR code
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    try {
      // Create QR code SVG using a simple implementation
      // This uses the basic QR code pattern approach
      const size = 120;
      const modules = 25; // QR code grid size
      const moduleSize = size / modules;
      
      let svgContent = `<rect width="${size}" height="${size}" fill="white"/>`;
      
      // Generate a simple pattern based on the value (simplified QR code)
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          const hash = simpleHash(value + row + col);
          if (hash % 3 === 0) {
            const x = col * moduleSize;
            const y = row * moduleSize;
            svgContent += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
          }
        }
      }
      
      // Add finder patterns (corner squares)
      const finderSize = moduleSize * 7;
      const positions = [
        { x: 0, y: 0 },
        { x: size - finderSize, y: 0 },
        { x: 0, y: size - finderSize }
      ];
      
      positions.forEach(pos => {
        svgContent += `<rect x="${pos.x}" y="${pos.y}" width="${finderSize}" height="${finderSize}" fill="black"/>`;
        svgContent += `<rect x="${pos.x + moduleSize}" y="${pos.y + moduleSize}" width="${finderSize - 2 * moduleSize}" height="${finderSize - 2 * moduleSize}" fill="white"/>`;
        svgContent += `<rect x="${pos.x + 2 * moduleSize}" y="${pos.y + 2 * moduleSize}" width="${finderSize - 4 * moduleSize}" height="${finderSize - 4 * moduleSize}" fill="black"/>`;
      });
      
      return svgContent;
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  // Simple hash function for pattern generation
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Print QR Codes</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading items...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const allSelected = selectedItems.size === items.length;
  const someSelected = selectedItems.size > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Print QR Codes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="secondary">
                {selectedItems.size} of {items.length} selected
              </Badge>
            </div>
            
            <Button
              onClick={handlePrint}
              disabled={!someSelected}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Selected ({selectedItems.size})
            </Button>
          </div>

          {/* Items List */}
          <ScrollArea className="h-96 border rounded-lg">
            <div className="p-4 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border-2 transition-colors cursor-pointer",
                    selectedItems.has(item.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleItemToggle(item.id)}
                  />
                  
                  <div className="flex-shrink-0">
                    <QRCodeSVG
                      value={item.qr_code_data || item.item_code}
                      size={48}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{item.tool_number}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {item.products.name}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items with QR codes found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};