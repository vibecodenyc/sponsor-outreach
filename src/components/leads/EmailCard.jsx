import React from 'react';
import { CopyButton } from '../ui/CopyButton';

export function EmailCard({ email }) {
  const fullText = `Subject: ${email.subject}\n\n${email.body}`;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-white leading-snug">{email.subject}</p>
        <CopyButton text={fullText} small />
      </div>
      <pre className="whitespace-pre-wrap text-sm text-zinc-400 leading-relaxed font-sans">
        {email.body}
      </pre>
    </div>
  );
}
