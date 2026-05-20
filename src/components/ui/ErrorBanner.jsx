import React from 'react';

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm">
      {message}
    </div>
  );
}
