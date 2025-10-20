import { MoreHorizontal, Eye, CreditCard, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getInvoiceStatusBadgeVariant } from "@/lib/statusBadgeUtils";

interface InvoiceCardProps {
  invoice: any;
  onViewInvoice: () => void;
  onCollectPayment?: () => void;
}

export function InvoiceCard({ invoice, onViewInvoice, onCollectPayment }: InvoiceCardProps) {
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
      'draft': { 
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600', 
        label: 'Draft' 
      },
      'sent': { 
        gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', 
        label: 'Sent' 
      },
      'paid': { 
        gradient: 'bg-gradient-to-r from-green-500 to-green-600', 
        label: 'Paid' 
      },
      'unpaid': { 
        gradient: 'bg-gradient-to-r from-red-500 to-red-600', 
        label: 'Unpaid' 
      },
      'overdue': { 
        gradient: 'bg-gradient-to-r from-orange-500 to-orange-600', 
        label: 'Overdue' 
      },
      'cancelled': { 
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600', 
        label: 'Cancelled' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      label: status.charAt(0).toUpperCase() + status.slice(1)
    };

    return (
      <Badge 
        variant={getInvoiceStatusBadgeVariant(status as any)}
        className={`${config.gradient} text-white border-0 font-bold px-3 py-1 rounded-full`}
      >
        {config.label}
      </Badge>
    );
  };

  const isDueSoon = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    const due = new Date(dueDate);
    const today = new Date();
    return due < today;
  };

  const dueSoon = isDueSoon(invoice.due_date, invoice.status);
  const overdue = isOverdue(invoice.due_date, invoice.status);

  return (
    <Card 
      className={`mb-3 hover:shadow-lg transition-shadow cursor-pointer ${
        overdue ? 'border-red-500 border-2' : 
        dueSoon ? 'border-yellow-500 border-2' : ''
      }`}
      onClick={onViewInvoice}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-foreground">
                {invoice.invoice_number}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(invoice.amount)}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(invoice.status)}
              {overdue && (
                <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 font-bold">
                  OVERDUE
                </Badge>
              )}
              {dueSoon && !overdue && (
                <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-0 font-bold">
                  DUE SOON
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onViewInvoice}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {(invoice.status === 'unpaid' || invoice.status === 'overdue') && onCollectPayment && (
                <DropdownMenuItem 
                  className="text-blue-600 focus:text-blue-600"
                  onClick={onCollectPayment}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Collect Payment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="font-medium text-foreground">
            {(invoice.customers as any)?.name || 'Unknown Customer'}
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <div>
              <span className="text-xs">Issue: </span>
              <span className="font-medium">{formatDate(invoice.created_at)}</span>
            </div>
            <div className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-yellow-600 font-medium' : ''}>
              <span className="text-xs">Due: </span>
              <span className="font-medium">{formatDate(invoice.due_date)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
