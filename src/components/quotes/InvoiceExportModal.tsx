import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Mail, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoice_number: string;
    customers?: {
      name: string;
      email: string;
    };
  };
}

export const InvoiceExportModal = ({ isOpen, onClose, invoice }: InvoiceExportModalProps) => {
  const [action, setAction] = useState<'generate_pdf' | 'send_email' | 'both'>('generate_pdf');
  const [recipientEmail, setRecipientEmail] = useState(invoice.customers?.email || '');
  const [recipientName, setRecipientName] = useState(invoice.customers?.name || '');
  const [subject, setSubject] = useState(`Invoice ${invoice.invoice_number} from PortaPro`);
  const [message, setMessage] = useState(`Dear ${invoice.customers?.name || 'Customer'},

Please find attached your invoice from PortaPro. Payment is due according to the terms specified in the invoice.

If you have any questions about this invoice or need to discuss payment arrangements, please contact us immediately.

Thank you for your business!

Best regards,
PortaPro Team`);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-and-email', {
        body: {
          type: 'invoice',
          id: invoice.id,
          action,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject,
          message
        }
      });

      if (error) throw error;

      // Handle PDF generation if requested
      if (action === 'generate_pdf' || action === 'both') {
        if (data.html) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(data.html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          }
        } else {
          throw new Error('PDF generation failed - no HTML content received');
        }
      }

      if (action === 'generate_pdf') {
        toast.success('PDF ready for printing!');
      } else if (action === 'send_email') {
        toast.success('Invoice emailed successfully!');
      } else {
        toast.success('PDF ready and invoice emailed successfully!');
      }

      onClose();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to process invoice export');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Export Action</Label>
            <RadioGroup value={action} onValueChange={setAction as any} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="generate_pdf" id="generate_pdf" />
                <Label htmlFor="generate_pdf" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Generate PDF only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="send_email" id="send_email" />
                <Label htmlFor="send_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send email only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generate PDF and send email
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(action === 'send_email' || action === 'both') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@email.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Invoice subject line"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Email Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your email message..."
                  rows={6}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isLoading || (action !== 'generate_pdf' && !recipientEmail)}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'generate_pdf' && <Download className="mr-2 h-4 w-4" />}
                  {action === 'send_email' && <Mail className="mr-2 h-4 w-4" />}
                  {action === 'both' && <FileText className="mr-2 h-4 w-4" />}
                  {action === 'generate_pdf' && 'Generate PDF'}
                  {action === 'send_email' && 'Send Email'}
                  {action === 'both' && 'Export & Email'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};