import React from 'react';

export const STATUS_CONFIG = {
  new:       { label: 'New',       dot: 'bg-zinc-500',    pill: 'bg-zinc-800/80   border-zinc-700  text-zinc-400'  },
  approved:  { label: 'Approved',  dot: 'bg-blue-400',    pill: 'bg-blue-950/80   border-blue-800  text-blue-400'  },
  contacted: { label: 'Contacted', dot: 'bg-amber-400',   pill: 'bg-amber-950/80  border-amber-800 text-amber-400' },
  replied:   { label: 'Replied',   dot: 'bg-emerald-400', pill: 'bg-emerald-950/80 border-emerald-800 text-emerald-400' },
  declined:  { label: 'Declined',  dot: 'bg-red-500',     pill: 'bg-red-950/80    border-red-800   text-red-400'   },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
