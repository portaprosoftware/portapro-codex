import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Menu, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TechnicianHeaderProps {
  userName: string;
  onRefresh: () => void;
}

export const TechnicianHeader: React.FC<TechnicianHeaderProps> = ({ userName, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => navigate('/fleet')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Work Orders</h1>
            <p className="text-sm text-muted-foreground">Hello, {userName}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={onRefresh}
        >
          <RefreshCw className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};
