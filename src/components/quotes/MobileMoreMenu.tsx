import { Button } from "@/components/ui/button";
import { MoreHorizontal, Download, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileMoreMenuProps {
  onExport: () => void;
  onQuickBooksExport: () => void;
  type: 'quotes' | 'invoices';
}

export function MobileMoreMenu({ 
  onExport, 
  onQuickBooksExport,
  type 
}: MobileMoreMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="lg:hidden min-h-[44px] min-w-[44px]"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export {type === 'quotes' ? 'Quotes' : 'Invoices'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onQuickBooksExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to QuickBooks
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
