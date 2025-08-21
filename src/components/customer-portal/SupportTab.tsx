import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Headphones,
  MessageSquare,
  FileText,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  HelpCircle,
  BookOpen,
  Video,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SupportTabProps {
  customerId: string;
}

const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const TICKET_CATEGORIES = [
  'Service Issue',
  'Billing Question',
  'Technical Support',
  'Equipment Problem',
  'Account Access',
  'General Inquiry'
];

const FAQ_ITEMS = [
  {
    category: 'Service',
    question: 'How often are units serviced?',
    answer: 'Standard units are serviced weekly, but frequency can be customized based on your needs.'
  },
  {
    category: 'Billing',
    question: 'When are invoices due?',
    answer: 'Invoices are typically due 7-14 days after the invoice date, depending on your payment terms.'
  },
  {
    category: 'Equipment',
    question: 'What should I do if a unit needs repair?',
    answer: 'Contact us immediately through the customer portal or call our emergency line for urgent repairs.'
  },
  {
    category: 'Account',
    question: 'How do I add additional users to my account?',
    answer: 'Navigate to the Users & Roles tab to invite team members and assign appropriate permissions.'
  }
];

export const SupportTab: React.FC<SupportTabProps> = ({ customerId }) => {
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketData, setTicketData] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    description: '',
    attachments: [] as File[]
  });

  const queryClient = useQueryClient();

  // Mock support tickets data
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', customerId],
    queryFn: async () => {
      // Mock data - in real app this would be a proper table
      const mockTickets = [
        {
          id: '1',
          ticket_number: 'SUP-001',
          subject: 'Unit needs repair',
          category: 'Equipment Problem',
          priority: 'high',
          status: 'open',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Unit 3002 has a broken lock and needs immediate attention.',
          responses: 2
        },
        {
          id: '2',
          ticket_number: 'SUP-002',
          subject: 'Billing discrepancy',
          category: 'Billing Question',
          priority: 'normal',
          status: 'in_progress',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'There seems to be an error on invoice INV-123. Can you please review?',
          responses: 1
        }
      ];
      return mockTickets;
    },
    enabled: !!customerId,
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock submission - would integrate with real ticketing system
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', customerId] });
      setShowNewTicketDialog(false);
      resetTicketForm();
      toast.success('Support ticket submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit ticket. Please try again.');
    }
  });

  const resetTicketForm = () => {
    setTicketData({
      subject: '',
      category: '',
      priority: 'normal',
      description: '',
      attachments: []
    });
  };

  const getSupportStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'assigned';
      case 'in_progress': return 'in-progress';
      case 'resolved': return 'completed';
      case 'closed': return 'inactive';
      default: return 'inactive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Clock;
      case 'in_progress': return AlertTriangle;
      case 'resolved': return CheckCircle;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    return TICKET_PRIORITIES.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const filteredFAQs = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (ticketsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Support & Help</h3>
          <p className="text-sm text-muted-foreground">
            Get help, submit tickets, and access resources
          </p>
        </div>
        
        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Brief description of the issue"
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({...ticketData, subject: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={ticketData.category} onValueChange={(value) => setTicketData({...ticketData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={ticketData.priority} onValueChange={(value) => setTicketData({...ticketData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Provide detailed information about your issue..."
                  value={ticketData.description}
                  onChange={(e) => setTicketData({...ticketData, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag files here or click to upload
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Choose Files
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => submitTicketMutation.mutate(ticketData)}
                  disabled={submitTicketMutation.isPending || !ticketData.subject || !ticketData.description}
                  className="flex-1"
                >
                  {submitTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Quick Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Emergency Support</p>
                <p className="text-sm text-muted-foreground">24/7 available</p>
                <p className="text-sm font-mono">(555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">General Support</p>
                <p className="text-sm text-muted-foreground">Business hours</p>
                <p className="text-sm">support@company.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Your Support Tickets</h4>
          </div>

          <div className="space-y-3">
            {tickets.map((ticket) => {
              const StatusIcon = getStatusIcon(ticket.status);
              return (
                <Card key={ticket.id} className="customer-portal-card border-0 shadow-none hover:transform hover:-translate-y-1 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{ticket.ticket_number}</h5>
                            <Badge variant={getSupportStatusVariant(ticket.status) as any}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={cn("text-xs", getPriorityColor(ticket.priority))}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">{ticket.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Updated</p>
                          <p>{format(new Date(ticket.updated_at), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{ticket.responses} responses</p>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {tickets.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h5 className="font-medium mb-2">No Support Tickets</h5>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any support tickets yet.
                  </p>
                  <Button onClick={() => setShowNewTicketDialog(true)}>
                    Submit Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      </div>
                      <h5 className="font-medium mb-2">{faq.question}</h5>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h5 className="font-medium mb-2">No Results Found</h5>
                <p className="text-muted-foreground">
                  Try searching with different keywords or submit a support ticket.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <h4 className="text-md font-medium">Help Resources</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">User Manual</h5>
                    <p className="text-sm text-muted-foreground">Complete guide to using your account</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Video Tutorials</h5>
                    <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">API Documentation</h5>
                    <p className="text-sm text-muted-foreground">Technical integration guides</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Community Forum</h5>
                    <p className="text-sm text-muted-foreground">Connect with other customers</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};