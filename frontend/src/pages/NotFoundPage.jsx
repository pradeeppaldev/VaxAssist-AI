import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <span className="rounded-full bg-blue-100 p-3 text-blue-600 mb-4">
        <Home className="h-8 w-8" />
      </span>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <p className="mt-2 text-lg text-slate-600">The requested page could not be found.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        <span>Return Home</span>
      </Link>
    </div>
  );
}
