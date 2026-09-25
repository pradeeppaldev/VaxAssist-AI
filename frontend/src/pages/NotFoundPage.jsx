import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
      <div className="rounded-2xl bg-secondary p-4 text-primary">
        <Home className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight font-sans">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        The requested page does not exist or has been relocated within the VaxAssist portal.
      </p>
      <div className="pt-2">
        <Button asChild variant="cyan" className="gap-2 font-semibold">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
