
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Plus, Bot, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AIEmailGeneratorModal } from './AIEmailGeneratorModal';
import { NewMessageModal } from './NewMessageModal';
import { PortalLinkModal } from './PortalLinkModal';

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
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Communication History</h3>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAIEmail(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Email
          </Button>
          <Button
            onClick={() => setShowNewMessage(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
          <Button
            onClick={() => setShowPortalLink(true)}
            variant="outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Portal Link
          </Button>
        </div>
      </div>

      {/* Communication History Table */}
      <div className="bg-card rounded-2xl border shadow-sm">
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
