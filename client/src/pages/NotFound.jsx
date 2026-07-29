import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-fade">
      <span className="material-symbols-rounded text-primary text-7xl mb-4 animate-pulse">eco</span>
      <h1 className="font-primary font-bold text-4xl text-text-primary mb-2">404 - Page Not Found</h1>
      <p className="text-text-secondary text-sm max-w-sm mb-6">
        The circular page path you are looking for has either decayed or been recycled out of circulation.
      </p>
      <Link to="/" className="btn bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-semibold shadow-md">
        Return Home
      </Link>
    </div>
  );
}
