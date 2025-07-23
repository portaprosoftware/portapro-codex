
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface PortalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

export function PortalLinkModal({ isOpen, onClose, customerId }: PortalLinkModalProps) {
  const [linkType, setLinkType] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const LINK_TYPES = [
    { value: 'quote_view', label: 'View Quotes' },
    { value: 'invoice_view', label: 'View Invoices' },
    { value: 'payment', label: 'Make Payment' },
    { value: 'full_portal', label: 'Full Customer Portal' },
  ];

  const handleGenerateLink = () => {
    // Generate a secure portal link
    const baseUrl = window.location.origin;
    const token = generateSecureToken();
    const link = `${baseUrl}/portal/${token}?type=${linkType}&expires=${expirationDays}`;
    setGeneratedLink(link);
  };

  const generateSecureToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const resetForm = () => {
    setLinkType('');
    setExpirationDays('7');
    setGeneratedLink('');
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            Generate Customer Portal Link
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Portal Access Type</Label>
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger>
                <SelectValue placeholder="Select portal access type" />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Link Expiration</Label>
            <Select value={expirationDays} onValueChange={setExpirationDays}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateLink}
            disabled={!linkType}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Generate Portal Link
          </Button>

          {generatedLink && (
            <div className="space-y-3 pt-4 border-t">
              <Label>Generated Portal Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 bg-muted"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                This link will expire in {expirationDays} day(s) and provides access to {LINK_TYPES.find(t => t.value === linkType)?.label.toLowerCase()}.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
