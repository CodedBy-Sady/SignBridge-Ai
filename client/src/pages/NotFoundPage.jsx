import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <span className="text-6xl font-black text-brand-600">404</span>
      <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm">
        The route you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md hover:bg-brand-700 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to SignBridge Home</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;

