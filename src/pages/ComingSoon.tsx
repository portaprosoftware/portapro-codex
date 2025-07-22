import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title, 
  description = "This feature is currently under development and will be available soon." 
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </div>

      <Card className="card-elevated p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
          <p className="text-muted-foreground mb-6">{description}</p>
          <Button className="btn-hero" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};