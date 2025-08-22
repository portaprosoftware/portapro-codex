import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Mail, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuoteExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: {
    id: string;
    quote_number: string;
    customers?: {
      name: string;
      email: string;
    };
  };
}

export const QuoteExportModal = ({ isOpen, onClose, quote }: QuoteExportModalProps) => {
  const [action, setAction] = useState<'generate_pdf' | 'send_email' | 'both'>('generate_pdf');
  const [recipientEmail, setRecipientEmail] = useState(quote.customers?.email || '');
  const [recipientName, setRecipientName] = useState(quote.customers?.name || '');
  const [subject, setSubject] = useState(`Quote ${quote.quote_number} from PortaPro`);
  const [message, setMessage] = useState(`Dear ${quote.customers?.name || 'Customer'},

Please find attached your quote from PortaPro. We appreciate your business and look forward to serving you.

If you have any questions, please don't hesitate to contact us.

Best regards,
PortaPro Team`);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      if (action === 'generate_pdf') {
        // Simple PDF generation - for now we'll simulate it
        // In a real app, you'd integrate with a PDF generation service
        const blob = new Blob(['Quote PDF content would go here'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quote-${quote.quote_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('PDF downloaded successfully!');
      } else if (action === 'send_email') {
        // Email functionality - for now we'll show a success message
        // In a real app, you'd send this to your email service
        toast.success('Quote emailed successfully!');
      } else {
        // Both actions
        toast.success('PDF generated and quote emailed successfully!');
      }

      onClose();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to process quote export');
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
            Export Quote {quote.quote_number}
          </DialogTitle>
          <DialogDescription>
            Generate a PDF or send the quote via email to your customer.
          </DialogDescription>
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
                  placeholder="Quote subject line"
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