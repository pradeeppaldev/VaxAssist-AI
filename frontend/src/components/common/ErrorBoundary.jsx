import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full border border-destructive/30 bg-destructive/5 text-foreground shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-sora text-foreground">
                  Something unexpected happened
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  The clinical workspace encountered a display error. You can try refreshing the page or navigating back to your dashboard.
                </p>
                {this.state.error?.message && (
                  <p className="text-[11px] font-mono text-destructive/80 bg-background/80 p-2 rounded border border-destructive/20 mt-2 text-left truncate">
                    {this.state.error.message}
                  </p>
                )}
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Button size="sm" onClick={this.handleReset} className="gap-2">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reload Page</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/patient/dashboard'}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
