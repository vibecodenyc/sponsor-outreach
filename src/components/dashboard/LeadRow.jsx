import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CompanyAvatar } from './CompanyAvatar';
import { StatusBadge, STATUS_CONFIG } from './StatusBadge';
import { FitBar } from './FitBar';
import { EditableCell } from './EditableCell';
import { OutreachSequence } from './OutreachSequence';

const COLS = '40px 200px 200px 1fr 80px 150px 36px';

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
      {['Company', 'Contact', 'Rationale', 'Fit', 'Status', ''].map((h, i) => (
        <span key={i} className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
          {h}
        </span>
      ))}
    </div>
  );
}

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

export function LeadRow({ lead, selected, onSelect, onUpdate, onSetStatus, statuses, eventName, eventType, city, sponsorGoals, sequence, onSequenceGenerated }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border-b border-zinc-800/60 transition-colors ${
      selected ? 'bg-blue-950/20' : expanded ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/40'
    }`}>
      {/* Main row */}
      <div
        className="grid items-center gap-3 px-4 py-3.5"
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
            {lead.category && (
              <span className="text-[11px] text-zinc-600 truncate block">{lead.category}</span>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-300 truncate">{lead.contact || '—'}</p>
          <p className="text-[11px] text-zinc-600 truncate">{lead.title || ''}</p>
          <p className="text-[11px] text-zinc-500 truncate font-mono">{lead.email || ''}</p>
        </div>

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

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Collapse' : 'View outreach sequence'}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded sequence panel */}
      {expanded && (
        <div className="px-5 pb-6 pt-2 border-t border-zinc-800/60">
          <OutreachSequence
            lead={lead}
            eventName={eventName}
            eventType={eventType}
            city={city}
            sponsorGoals={sponsorGoals}
            sequence={sequence}
            onGenerated={onSequenceGenerated}
          />
        </div>
      )}
    </div>
  );
}
