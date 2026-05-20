import React from 'react';
import { CopyButton } from '../ui/CopyButton';

export function FollowupCard({ email }) {
  const fullText = `Subject: ${email.subject}\n\n${email.body}`;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-400">
            Day {email.day}
          </span>
          <p className="text-sm font-semibold text-white leading-snug">{email.subject}</p>
        </div>
        <CopyButton text={fullText} small />
      </div>
      <pre className="whitespace-pre-wrap text-sm text-zinc-400 leading-relaxed font-sans">
        {email.body}
      </pre>
    </div>
  );
}
