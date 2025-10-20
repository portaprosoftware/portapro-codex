import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, MessageSquare, ExternalLink, MoreVertical, Eye, Send, Edit, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CommunicationCardProps {
  communication: {
    id: string;
    type: string;
    sent_at: string;
    subject?: string | null;
    content: string;
    status: string;
  };
}

export function CommunicationCard({ communication }: CommunicationCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': 
        return <Mail className="w-4 h-4" />;
      case 'sms': 
        return <MessageSquare className="w-4 h-4" />;
      case 'portal':
        return <ExternalLink className="w-4 h-4" />;
      default: 
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { label: 'Sent', gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
      delivered: { label: 'Delivered', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600' },
      opened: { label: 'Opened', gradient: 'bg-gradient-to-r from-teal-500 to-teal-600' },
      failed: { label: 'Failed', gradient: 'bg-gradient-to-r from-red-500 to-red-600' },
      pending: { label: 'Pending', gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
      draft: { label: 'Draft', gradient: 'bg-gradient-to-r from-gray-500 to-gray-600' },
      portal: { label: 'Portal', gradient: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`text-white font-medium whitespace-nowrap ${config.gradient}`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      case 'portal': return 'Portal';
      default: return type;
    }
  };

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Row 1: Subject and Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-semibold text-base line-clamp-2 flex-1 min-w-0 break-words">
          {communication.subject || '(no subject)'}
        </h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(communication.status)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label="Communication actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {communication.status === 'draft' ? (
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Draft
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem>
                  <Send className="w-4 h-4 mr-2" />
                  Resend/Reply
                </DropdownMenuItem>
              )}
              {communication.type === 'portal' && (
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Metadata (Type, Date/Time, Direction) */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          {getTypeIcon(communication.type)}
          <span>{getTypeLabel(communication.type)}</span>
        </div>
        <span>•</span>
        <span>
          {format(new Date(communication.sent_at), 'MMM d, yyyy')}
        </span>
        <span>•</span>
        <span>
          {format(new Date(communication.sent_at), 'h:mm a')}
        </span>
      </div>

      {/* Row 3: Preview Text */}
      <div className="text-sm text-muted-foreground line-clamp-2 break-words">
        {communication.content.substring(0, 150)}
        {communication.content.length > 150 && '...'}
      </div>
    </Card>
  );
}
