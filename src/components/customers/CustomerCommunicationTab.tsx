
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Plus, Sparkles, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AIEmailGeneratorModal } from './AIEmailGeneratorModal';
import { NewMessageModal } from './NewMessageModal';
import { PortalLinkModal } from './PortalLinkModal';
import { CommunicationCard } from './CommunicationCard';

interface CustomerCommunicationTabProps {
  customerId: string;
}

export function CustomerCommunicationTab({ customerId }: CustomerCommunicationTabProps) {
  const [showAIEmail, setShowAIEmail] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showPortalLink, setShowPortalLink] = useState(false);

  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['customer-communications', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_communications')
        .select('*')
        .eq('customer_id', customerId)
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'delivered': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden px-4 lg:px-0">
      {/* Header with Actions */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-foreground">Communication History</h3>
        
        {/* Action Buttons - Responsive Stack */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-3">
          <Button
            onClick={() => setShowAIEmail(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white min-h-[44px] justify-center"
            aria-label="Create AI email"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span>AI Email</span>
          </Button>
          <Button
            onClick={() => setShowNewMessage(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white min-h-[44px] justify-center"
            aria-label="Compose new message"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>New Message</span>
          </Button>
          <Button
            onClick={() => setShowPortalLink(true)}
            variant="outline"
            className="min-h-[44px] justify-center xs:col-span-2 lg:col-span-1"
            aria-label="Open customer portal"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span>Portal Link</span>
          </Button>
        </div>
      </div>

      {/* Mobile/Tablet Card View (<1024px) */}
      <div className="lg:hidden">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading communications...
          </div>
        ) : communications.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border shadow-sm">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Communication History</h4>
            <p className="text-muted-foreground mb-4">
              Start communicating with this customer
            </p>
            <Button
              onClick={() => setShowNewMessage(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {communications.map((comm) => (
              <CommunicationCard key={comm.id} communication={comm} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (≥1024px) */}
      <div className="hidden lg:block bg-card rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-foreground">Type</TableHead>
              <TableHead className="font-medium text-foreground">Date & Time</TableHead>
              <TableHead className="font-medium text-foreground">Subject/Preview</TableHead>
              <TableHead className="font-medium text-foreground">Status</TableHead>
              <TableHead className="font-medium text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading communications...
                </TableCell>
              </TableRow>
            ) : communications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No communication history found
                </TableCell>
              </TableRow>
            ) : (
              communications.map((comm) => (
                <TableRow key={comm.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(comm.type)}
                      <span className="capitalize">{comm.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(comm.sent_at), 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(comm.sent_at), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      {comm.subject && (
                        <div className="font-medium text-sm mb-1">{comm.subject}</div>
                      )}
                      <div className="text-sm text-muted-foreground truncate">
                        {comm.content.substring(0, 100)}
                        {comm.content.length > 100 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-white ${getStatusColor(comm.status)}`}>
                      {comm.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AIEmailGeneratorModal 
        isOpen={showAIEmail}
        onClose={() => setShowAIEmail(false)}
        customerId={customerId}
      />
      
      <NewMessageModal 
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        customerId={customerId}
      />
      
      <PortalLinkModal 
        isOpen={showPortalLink}
        onClose={() => setShowPortalLink(false)}
        customerId={customerId}
      />
    </div>
  );
}
