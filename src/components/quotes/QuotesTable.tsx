import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, MoreHorizontal, BriefcaseIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InvoiceCreationWizard } from "./InvoiceCreationWizard";
import { ViewQuoteModal } from "./ViewQuoteModal";
import { QuoteCard } from "./QuoteCard";
import { useConvertQuoteToJob } from "@/hooks/useConvertQuoteToJob";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface QuotesTableProps {
  searchTerm: string;
  dateRange?: DateRange;
}

export const QuotesTable = ({ searchTerm, dateRange }: QuotesTableProps) => {
  const { orgId } = useOrganizationId();
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedQuoteForInvoice, setSelectedQuoteForInvoice] = useState<any>(null);
  const [showViewQuote, setShowViewQuote] = useState(false);
  const [selectedQuoteForView, setSelectedQuoteForView] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const queryClient = useQueryClient();
  const convertQuoteToJob = useConvertQuoteToJob();

  // Fetch total count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['quotes-count', searchTerm, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'draft');

      if (searchTerm) {
        query = query.or(`quote_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('created_at', format(dateRange.to, 'yyyy-MM-dd') + ' 23:59:59');
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', searchTerm, dateRange, currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      let query = supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id (
            name,
            email
          )
        `)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (searchTerm) {
        query = query.or(`quote_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('created_at', format(dateRange.to, 'yyyy-MM-dd') + ' 23:59:59');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

  const createInvoiceFromQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      if (!orgId) throw new Error('Organization ID required');
      const { data, error } = await supabase.rpc('generate_invoice_from_quote', {
        quote_uuid: quoteId,
        org_id: orgId
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
    <>
      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden lg:block rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/50">
              <TableHead className="font-medium text-sm text-foreground">Quote #</TableHead>
              <TableHead className="font-medium text-sm text-foreground">Customer</TableHead>
              <TableHead className="font-medium text-sm text-foreground">Date</TableHead>
              <TableHead className="font-medium text-sm text-foreground">Amount</TableHead>
              <TableHead className="font-medium text-sm text-foreground">Status</TableHead>
              <TableHead className="font-medium text-sm text-foreground">Expiration</TableHead>
              <TableHead className="font-medium text-sm text-foreground w-20 whitespace-nowrap">Actions</TableHead>
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
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedQuoteForView(quote.id);
                          setShowViewQuote(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Quote
                      </DropdownMenuItem>
                      {quote.status === 'accepted' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedQuoteForInvoice(quote);
                              setShowCreateInvoice(true);
                            }}
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
        
        {(!quotes || quotes.length === 0) && !isLoading && (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No quotes found</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} quotes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View - visible on mobile/tablet */}
      <div className="lg:hidden px-4 space-y-3">
        {quotes && quotes.length > 0 ? (
          quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onViewQuote={() => {
                setSelectedQuoteForView(quote.id);
                setShowViewQuote(true);
              }}
              onConvertToInvoice={() => {
                setSelectedQuoteForInvoice(quote);
                setShowCreateInvoice(true);
              }}
              onConvertToJob={() => convertQuoteToJob.mutate({ quoteId: quote.id })}
              isConvertingToJob={convertQuoteToJob.isPending}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No quotes found</p>
          </div>
        )}
      </div>

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

      <ViewQuoteModal
        isOpen={showViewQuote}
        onClose={() => {
          setShowViewQuote(false);
          setSelectedQuoteForView("");
        }}
        quoteId={selectedQuoteForView}
      />
    </>
  );
};