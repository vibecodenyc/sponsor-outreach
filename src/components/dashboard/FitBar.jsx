import React from 'react';

export function FitBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-amber-500'   :
                'bg-zinc-600';
  const textColor =
    pct >= 80 ? 'text-emerald-400' :
    pct >= 60 ? 'text-amber-400'   :
                'text-zinc-500';

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-sm font-semibold tabular-nums leading-none ${textColor}`}>{pct}</span>
      <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
