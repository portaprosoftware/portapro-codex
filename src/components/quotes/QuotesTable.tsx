import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, MoreHorizontal, BriefcaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InvoiceCreationWizard } from "./InvoiceCreationWizard";
import { useConvertQuoteToJob } from "@/hooks/useConvertQuoteToJob";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuotesTableProps {
  searchTerm: string;
}

export const QuotesTable = ({ searchTerm }: QuotesTableProps) => {
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedQuoteForInvoice, setSelectedQuoteForInvoice] = useState<any>(null);
  const queryClient = useQueryClient();
  const convertQuoteToJob = useConvertQuoteToJob();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`quote_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const createInvoiceFromQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('generate_invoice_from_quote', {
        quote_uuid: quoteId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Invoice created successfully from quote!");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedQuoteForInvoice(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create invoice from quote");
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { 
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600', 
        label: 'Draft' 
      },
      sent: { 
        gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', 
        label: 'Sent' 
      },
      pending: { 
        gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600', 
        label: 'Pending' 
      },
      accepted: { 
        gradient: 'bg-gradient-to-r from-green-500 to-green-600', 
        label: 'Accepted' 
      },
      expired: { 
        gradient: 'bg-gradient-to-r from-red-500 to-red-600', 
        label: 'Expired' 
      },
      rejected: { 
        gradient: 'bg-gradient-to-r from-red-500 to-red-600', 
        label: 'Rejected' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge className={`${config.gradient} text-white border-0 font-bold px-3 py-1 rounded-full`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading quotes...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50">
            <TableHead className="font-medium text-sm text-foreground">Quote #</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Customer</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Date</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Amount</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Status</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Expiration</TableHead>
            <TableHead className="font-medium text-sm text-foreground w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes?.map((quote, index) => (
            <TableRow 
              key={quote.id} 
              className={`border-b border-border ${index % 2 === 0 ? 'bg-muted/20' : 'bg-card'}`}
            >
              <TableCell className="font-medium text-sm text-foreground">
                {quote.quote_number || `Q-${quote.id.slice(0, 8)}`}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {(quote.customers as any)?.name || 'Unknown Customer'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(quote.created_at)}
              </TableCell>
              <TableCell className="text-sm text-foreground font-medium">
                {formatCurrency(quote.total_amount)}
              </TableCell>
              <TableCell>
                {getStatusBadge(quote.status)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {quote.expiration_date ? formatDate(quote.expiration_date) : 'No expiration'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {quote.status === 'accepted' && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => createInvoiceFromQuote.mutate(quote.id)}
                          disabled={createInvoiceFromQuote.isPending}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Convert to Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => convertQuoteToJob.mutate({ quoteId: quote.id })}
                          disabled={convertQuoteToJob.isPending}
                        >
                          <BriefcaseIcon className="mr-2 h-4 w-4" />
                          {convertQuoteToJob.isPending ? 'Converting...' : 'Convert to Job'}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {(!quotes || quotes.length === 0) && (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No quotes found</p>
        </div>
      )}


      {selectedQuoteForInvoice && (
        <InvoiceCreationWizard
          isOpen={showCreateInvoice}
          onClose={() => {
            setShowCreateInvoice(false);
            setSelectedQuoteForInvoice(null);
          }}
          fromQuoteId={selectedQuoteForInvoice.id}
        />
      )}
    </div>
  );
};