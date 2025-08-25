import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, FileText, Clock } from "lucide-react";

interface QuoteApprovalFlowProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  onCreateJob: () => void;
  onCreateInvoice: () => void;
}

export const QuoteApprovalFlow: React.FC<QuoteApprovalFlowProps> = ({
  isOpen,
  onClose,
  quote,
  onCreateJob,
  onCreateInvoice
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-foreground">
            Quote Approved! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Quote <span className="font-semibold">{quote?.quote_number || `Q-${quote?.id?.slice(0, 8)}`}</span> has been approved.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              What would you like to do next?
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onCreateJob}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 h-12"
            >
              <BriefcaseIcon className="mr-2 h-5 w-5" />
              Create Job
            </Button>

            <Button
              onClick={onCreateInvoice}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 h-12"
            >
              <FileText className="mr-2 h-5 w-5" />
              Create Invoice
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-12"
            >
              <Clock className="mr-2 h-5 w-5" />
              Create Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};