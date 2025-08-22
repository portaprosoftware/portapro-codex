import React, { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { clearClerkCache, logCurrentAuthState } from '@/utils/authCleanup';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const DevelopmentAuthDebug: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, role, isLoaded } = useUserRole();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          🔧 Auth Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-yellow-800">Auth Debug Info</h3>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'None'}
            </div>
            <div>
              <strong>Name:</strong> {user?.firstName} {user?.lastName}
            </div>
            <div>
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'None'}
            </div>
            <div>
              <strong>Role:</strong> {role}
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={clearClerkCache}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Clear Auth Cache
            </Button>
            <Button
              onClick={logCurrentAuthState}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Log Auth State
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Hard Refresh
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};