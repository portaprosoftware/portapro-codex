import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryAttempts: number;
}

export class JobsMapErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    retryAttempts: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('JobsMapErrorBoundary caught an error:', error);
    
    // Increment retry attempts
    return { hasError: true, error, retryAttempts: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map component error:', error, errorInfo);
    
    // Log specific DataCloneError information
    if (error.name === 'DataCloneError' || error.message.includes('DataCloneError')) {
      console.error('DataCloneError in map - likely caused by Date objects in React Query cache');
    }
  }

  private handleRetry = () => {
    if (this.state.retryAttempts < this.maxRetries) {
      // Clear React Query cache to prevent DataCloneError propagation
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        (window as any).queryClient.clear();
      }
      
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryAttempts: prevState.retryAttempts + 1
      }));
      
      // Call the optional retry callback
      this.props.onRetry?.();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryAttempts < this.maxRetries;
      const isDataCloneError = this.state.error?.name === 'DataCloneError' || 
                               this.state.error?.message.includes('DataCloneError');

      return (
        <div className="flex items-center justify-center h-96 w-full">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              
              <h3 className="text-lg font-semibold">Map Error</h3>
              
              <p className="text-sm text-muted-foreground">
                {isDataCloneError 
                  ? 'A data serialization error occurred with the map. This is usually temporary.'
                  : 'The map failed to load properly. Please try again.'
                }
              </p>

              {this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({this.maxRetries - this.state.retryAttempts} left)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload}
                  size="sm"
                >
                  Reload Page
                </Button>
              </div>

              {!canRetry && (
                <p className="text-xs text-muted-foreground">
                  Maximum retry attempts reached. Please reload the page.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}