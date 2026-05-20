import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { generateSequence } from '../../services/outreach';

const STAGE_STYLE = {
  outreach:   { badge: 'bg-blue-950/60 border-blue-800 text-blue-400',   dot: 'bg-blue-400' },
  followup_1: { badge: 'bg-amber-950/60 border-amber-800 text-amber-400', dot: 'bg-amber-400' },
  followup_2: { badge: 'bg-zinc-800 border-zinc-700 text-zinc-400',       dot: 'bg-zinc-500' },
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors text-[11px]"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function EmailCard({ email }) {
  const style = STAGE_STYLE[email.type] ?? STAGE_STYLE.followup_2;
  const full = `Subject: ${email.subject}\n\n${email.body}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${style.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {email.label}
          </span>
          <span className="text-[11px] text-zinc-600">Day {email.send_day}</span>
        </div>
        <CopyBtn text={full} />
      </div>

      {/* Subject */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Subject</p>
        <p className="text-sm font-semibold text-white leading-snug">{email.subject}</p>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Body</p>
        <pre className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
          {email.body}
        </pre>
      </div>
    </div>
  );
}

export function OutreachSequence({ lead, eventName, eventType, city, sponsorGoals, sequence, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const emails = await generateSequence({ eventName, eventType, city, sponsorGoals, sponsor: lead });
      onGenerated?.(emails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Not yet generated
  if (!sequence && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        {error && (
          <p className="text-xs text-red-400 mb-1">{error}</p>
        )}
        <button
          onClick={generate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          <Sparkles size={15} />
          Generate Outreach Sequence
        </button>
        <p className="text-[11px] text-zinc-600">
          3 emails · premium tone · ready to send
        </p>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <RefreshCw size={18} className="text-zinc-500 animate-spin" />
        <p className="text-sm text-zinc-500">Writing your sequence…</p>
      </div>
    );
  }

  // Generated
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
          Outreach Sequence · {lead.company || lead.name}
        </p>
        <button
          onClick={generate}
          className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <RefreshCw size={11} />
          Regenerate
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sequence.map(email => (
          <EmailCard key={email.stage} email={email} />
        ))}
      </div>
    </div>
  );
}
