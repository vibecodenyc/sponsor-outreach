import React from 'react';
import { daysSince } from '../../lib/utils';

export function SequencePill({ progress }) {
  if (!progress) return null;

  if (progress.replied) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950 border border-emerald-800 text-emerald-400">
        Replied ✓
      </span>
    );
  }

  const days = daysSince(progress.startedAt);
  const done = days >= 14;

  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
      done
        ? 'bg-zinc-900 border-zinc-700 text-zinc-500'
        : 'bg-amber-950/50 border-amber-800/60 text-amber-400'
    }`}>
      {done ? 'Sequence done' : `Day ${days}`}
    </span>
  );
}
