import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text, small = false }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 border border-zinc-700 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 ${
        small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'
      }`}
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
