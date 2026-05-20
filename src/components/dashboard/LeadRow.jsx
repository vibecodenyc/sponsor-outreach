import React, { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { CompanyAvatar } from './CompanyAvatar';
import { StatusBadge, STATUS_CONFIG } from './StatusBadge';
import { FitBar } from './FitBar';
import { EditableCell } from './EditableCell';

const COLS = '40px 200px 140px 1fr 80px 150px 76px';

// Column header row
export function LeadTableHeader({ allSelected, onSelectAll }) {
  return (
    <div
      className="grid items-center gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10"
      style={{ gridTemplateColumns: COLS }}
    >
      <input
        type="checkbox"
        checked={allSelected}
        onChange={e => onSelectAll(e.target.checked)}
        className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
      />
      {['Company', 'Category', 'Rationale', 'Fit', 'Status', 'Actions'].map(h => (
        <span key={h} className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
          {h}
        </span>
      ))}
    </div>
  );
}

// Status dropdown
function StatusDropdown({ status, onSetStatus, statuses }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1">
        <StatusBadge status={status} />
        <ChevronDown size={11} className="text-zinc-600 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-36 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
          {statuses.map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { onSetStatus(s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${
                  s === status ? 'text-white' : 'text-zinc-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LeadRow({ lead, selected, onSelect, onUpdate, onApprove, onRemove, onSetStatus, statuses }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`grid items-center gap-3 px-4 py-3.5 border-b border-zinc-800/60 transition-colors group ${
        selected
          ? 'bg-blue-950/20'
          : lead.outreach_status === 'approved'
          ? 'bg-blue-950/10 hover:bg-blue-950/20'
          : 'hover:bg-zinc-900/60'
      }`}
      style={{ gridTemplateColumns: COLS }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={e => onSelect(e.target.checked)}
        className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
      />

      {/* Company */}
      <div className="flex items-center gap-2.5 min-w-0">
        <CompanyAvatar name={lead.company || lead.name} />
        <div className="min-w-0">
          <EditableCell
            value={lead.company || lead.name}
            onChange={v => onUpdate({ company: v, name: v })}
            className="text-sm font-semibold text-white block truncate"
          />
        </div>
      </div>

      {/* Category */}
      <EditableCell
        value={lead.category}
        onChange={v => onUpdate({ category: v })}
        className="text-xs text-zinc-400 truncate"
        placeholder="No category"
      />

      {/* Rationale */}
      <EditableCell
        value={lead.rationale}
        onChange={v => onUpdate({ rationale: v })}
        multiline
        className="text-xs text-zinc-400 leading-relaxed line-clamp-2"
        placeholder="No rationale"
      />

      {/* Fit score */}
      <FitBar score={lead.fit_score} />

      {/* Status */}
      <StatusDropdown status={lead.outreach_status} onSetStatus={onSetStatus} statuses={statuses} />

      {/* Actions */}
      <div className={`flex items-center gap-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={onApprove}
          title={lead.outreach_status === 'approved' ? 'Unapprove' : 'Approve'}
          className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
            lead.outreach_status === 'approved'
              ? 'border-blue-700 bg-blue-900/60 text-blue-400'
              : 'border-zinc-700 hover:border-blue-700 hover:bg-blue-900/40 hover:text-blue-400 text-zinc-500'
          }`}
        >
          <Check size={12} />
        </button>
        <button
          onClick={onRemove}
          title="Remove lead"
          className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-700 hover:border-red-700 hover:bg-red-900/30 hover:text-red-400 text-zinc-600 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
