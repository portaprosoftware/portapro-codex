import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

/**
 * Unauthorized page - shown when user tries to access a deployment
 * they don't have access to (not part of the allowed Clerk Organization)
 */
const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center mb-6">
          <Logo showText={true} />
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            This account isn't part of this company's workspace.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-sm text-left space-y-2">
          <p className="text-muted-foreground">
            <strong className="text-foreground">What happened?</strong>
            <br />
            You signed in with an account that doesn't have access to this deployment.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">What can you do?</strong>
            <br />
            • Sign in with the correct account for this company
            <br />
            • Contact your company administrator for access
            <br />
            • Use the correct company link if you have multiple accounts
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={() => navigate('/auth')}
            className="flex-1"
          >
            Sign In Again
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1"
          >
            Go to Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Need help? Contact support at{' '}
          <a 
            href="mailto:support@portaprosoftware.com" 
            className="text-primary hover:underline"
          >
            support@portaprosoftware.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
