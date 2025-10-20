import { MoreHorizontal, Eye, FileText, BriefcaseIcon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface QuoteCardProps {
  quote: any;
  onViewQuote: () => void;
  onConvertToInvoice: () => void;
  onConvertToJob: () => void;
  isConvertingToJob: boolean;
}

export function QuoteCard({ 
  quote, 
  onViewQuote, 
  onConvertToInvoice, 
  onConvertToJob,
  isConvertingToJob 
}: QuoteCardProps) {
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

  return (
    <Card 
      className="mb-3 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onViewQuote}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-foreground">
                {quote.quote_number || `Q-${quote.id.slice(0, 8)}`}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(quote.total_amount)}
            </div>
            <div>{getStatusBadge(quote.status)}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onViewQuote}>
                <Eye className="mr-2 h-4 w-4" />
                View Quote
              </DropdownMenuItem>
              {quote.status === 'accepted' && (
                <>
                  <DropdownMenuItem onClick={onConvertToInvoice}>
                    <FileText className="mr-2 h-4 w-4" />
                    Convert to Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={onConvertToJob}
                    disabled={isConvertingToJob}
                  >
                    <BriefcaseIcon className="mr-2 h-4 w-4" />
                    {isConvertingToJob ? 'Converting...' : 'Convert to Job'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="font-medium text-foreground">
            {(quote.customers as any)?.name || 'Unknown Customer'}
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <div>
              <span className="text-xs">Date: </span>
              <span className="font-medium">{formatDate(quote.created_at)}</span>
            </div>
            {quote.expiration_date && (
              <div>
                <span className="text-xs">Expires: </span>
                <span className="font-medium">{formatDate(quote.expiration_date)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
