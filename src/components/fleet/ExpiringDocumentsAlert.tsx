import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function ExpiringDocumentsAlert() {
  const navigate = useNavigate();

  const { data: expiringDocs, isLoading } = useQuery({
    queryKey: ["expiring-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expiring_documents")
        .select("*")
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading || !expiringDocs || expiringDocs.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{expiringDocs.length} Document{expiringDocs.length > 1 ? 's' : ''} Expiring Soon</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/fleet/files')}
          className="bg-background text-foreground hover:bg-accent"
        >
          View All
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        {expiringDocs.slice(0, 3).map((doc: any) => (
          <div key={doc.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FileWarning className="h-3 w-3" />
              <span className="font-medium">{doc.license_plate}</span>
              <span className="text-muted-foreground">-</span>
              <span>{doc.category}</span>
            </div>
            <span className="text-xs">
              Expires {formatDistanceToNow(new Date(doc.expiration_date), { addSuffix: true })}
            </span>
          </div>
        ))}
        {expiringDocs.length > 3 && (
          <div className="text-xs text-muted-foreground mt-2">
            +{expiringDocs.length - 3} more documents
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
