import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Camera, CheckCircle, X, AlertTriangle, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BatchOCRProcessorProps {
  open: boolean;
  onClose: () => void;
  productId?: string;
}

interface ProcessingItem {
  id: string;
  item_code: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  ocrResults?: any;
  error?: string;
}

export const BatchOCRProcessor: React.FC<BatchOCRProcessorProps> = ({
  open,
  onClose,
  productId
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processedItems, setProcessedItems] = useState<ProcessingItem[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Fetch items that need OCR processing
  const { data: unprocessedItems } = useQuery({
    queryKey: ["unprocessed-items", productId],
    queryFn: async () => {
      let query = supabase
        .from("product_items")
        .select("id, item_code, tool_number, verification_status")
        .is("tool_number", null);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const processItem = async (item: any): Promise<ProcessingItem> => {
    try {
      // Simulate OCR processing (in real implementation, this would capture and process images)
      const response = await supabase.functions.invoke('ocr-tool-tracking', {
        body: {
          itemId: item.id,
          simulate: true // For demo purposes
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        id: item.id,
        item_code: item.item_code,
        status: "completed",
        progress: 100,
        ocrResults: response.data
      };
    } catch (error) {
      return {
        id: item.id,
        item_code: item.item_code,
        status: "failed",
        progress: 0,
        error: error instanceof Error ? error.message : "Processing failed"
      };
    }
  };

  const startBatchProcessing = async () => {
    if (!unprocessedItems?.length) return;

    setIsProcessing(true);
    setProcessedItems([]);
    setCurrentProgress(0);

    const totalItems = unprocessedItems.length;
    
    for (let i = 0; i < totalItems && !isPaused; i++) {
      const item = unprocessedItems[i];
      
      // Update status to processing
      setProcessedItems(prev => [
        ...prev,
        {
          id: item.id,
          item_code: item.item_code,
          status: "processing",
          progress: 50
        }
      ]);

      try {
        const result = await processItem(item);
        
        setProcessedItems(prev => 
          prev.map(p => p.id === item.id ? result : p)
        );

        setCurrentProgress(((i + 1) / totalItems) * 100);

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    setIsProcessing(false);
    
    toast({
      title: "Batch Processing Complete",
      description: `Processed ${totalItems} items`,
    });
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    setIsProcessing(false);
  };

  const resumeProcessing = () => {
    setIsPaused(false);
    startBatchProcessing();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="outline">Pending</Badge>,
      processing: <Badge className="bg-blue-100 text-blue-700">Processing</Badge>,
      completed: <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>,
      failed: <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Batch OCR Processing
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            <p><strong>What is Batch OCR?</strong></p>
            <p>This feature automatically processes multiple inventory items to extract tool tracking information (tool numbers, vendor IDs, etc.) from product labels using AI-powered image recognition.</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Processing Overview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Processing Status</h3>
                <p className="text-sm text-gray-600">
                  {unprocessedItems?.length || 0} items ready for OCR processing
                </p>
              </div>
              <div className="flex gap-2">
                {!isProcessing && !isPaused && (
                  <Button onClick={startBatchProcessing} disabled={!unprocessedItems?.length}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Processing
                  </Button>
                )}
                {isProcessing && (
                  <Button variant="outline" onClick={pauseProcessing}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                {isPaused && (
                  <Button onClick={resumeProcessing}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
              </div>
            </div>
            
            {(isProcessing || processedItems.length > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(currentProgress)}%</span>
                </div>
                <Progress value={currentProgress} className="w-full" />
              </div>
            )}
          </div>

          {/* Processing Queue */}
          {processedItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Processing Results</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tool Number</TableHead>
                    <TableHead>Vendor ID</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_code}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.ocrResults?.toolNumber || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.ocrResults?.vendorId || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.error ? (
                          <span className="text-red-600">{item.error}</span>
                        ) : item.status === "completed" ? (
                          "Successfully processed"
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Unprocessed Items Preview */}
          {unprocessedItems && unprocessedItems.length > 0 && processedItems.length === 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Items Ready for Processing</h3>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Current Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unprocessedItems.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">No tool data</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {unprocessedItems.length > 10 && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    ...and {unprocessedItems.length - 10} more items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};