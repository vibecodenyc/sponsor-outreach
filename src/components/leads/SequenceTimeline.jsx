import React, { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { daysSince, targetDate } from '../../lib/utils';
import { gmailSearchReply } from '../../services/gmail';

const STEPS = [
  { label: 'Outreach', day: 0 },
  { label: 'Day 3 follow-up', day: 3 },
  { label: 'Day 7 follow-up', day: 7 },
  { label: 'Day 14 follow-up', day: 14 },
];

export function SequenceTimeline({ progress, sponsor, accessToken, onMarkReplied }) {
  const [checking, setChecking] = useState(false);

  const checkReply = async () => {
    if (!accessToken) return;
    setChecking(true);
    try {
      const replied = await gmailSearchReply({
        leadEmail: sponsor.email,
        afterTimestamp: progress.startedAt,
        accessToken,
      });
      if (replied) onMarkReplied(sponsor.email);
    } finally {
      setChecking(false);
    }
  };

  const days = daysSince(progress.startedAt);

  return (
    <div>
      {progress.replied && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-sm">
          Lead replied — managing this thread manually in Gmail.
        </div>
      )}

      <div className="space-y-2 mb-5">
        {STEPS.map(({ label, day }, i) => {
          const sent = days >= day;
          const isCurrent = sent && (day === 14 || days < STEPS[i + 1]?.day);
          return (
            <div key={day} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                sent ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-700'
              }`}>
                {sent && <Check size={11} className="text-white" />}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className={`text-sm ${sent ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
                {day > 0 && (
                  <span className="text-xs text-zinc-600">
                    draft for {targetDate(progress.startedAt, day)}
                  </span>
                )}
              </div>
              {isCurrent && !progress.replied && (
                <span className="text-[11px] text-amber-400 font-medium">Current</span>
              )}
            </div>
          );
        })}
      </div>

      {!progress.replied && (
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={checkReply}
            disabled={checking || !accessToken}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs text-zinc-300 transition-colors"
          >
            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking…' : 'Check for reply'}
          </button>
          <p className="text-xs text-zinc-600">Manage scheduled drafts in Gmail's Drafts folder.</p>
        </div>
      )}
    </div>
  );
}
