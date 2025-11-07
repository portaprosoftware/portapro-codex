import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function NoPortalFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">No Organization Found</h1>
        <p className="text-muted-foreground">
          Your account is not associated with any organization. Please contact support.
        </p>
        <Button onClick={() => window.location.href = 'https://www.portaprosoftware.com'}>
          Return to PortaPro
        </Button>
      </div>
    </div>
  );
}
