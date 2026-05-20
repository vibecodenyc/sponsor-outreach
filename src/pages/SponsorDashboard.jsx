import React, { useState, useMemo } from 'react';
import { Search, Users, TrendingUp, CheckCircle, ArrowLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { LeadRow, LeadTableHeader } from '../components/dashboard/LeadRow';
import { STATUS_CONFIG } from '../components/dashboard/StatusBadge';
import { useLeads } from '../hooks/useLeads';
import { useGmail } from '../hooks/useGmail';

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({ label, value, sub }) {
  return (
    <div className="px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Audience panel ────────────────────────────────────────────────────────────

const PRIORITY_PILL = {
  high:   'bg-emerald-950/60 border-emerald-800 text-emerald-400',
  medium: 'bg-amber-950/60  border-amber-800  text-amber-400',
  low:    'bg-zinc-900      border-zinc-700   text-zinc-500',
};

function AudiencePanel({ audience, categories }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mb-5 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Audience Analysis</span>
          {audience.estimated_size && (
            <span className="text-xs text-zinc-700 ml-1">· {audience.estimated_size}</span>
          )}
        </div>
        {open ? <ChevronUp size={13} className="text-zinc-600" /> : <ChevronDown size={13} className="text-zinc-600" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800">
          <p className="text-sm text-zinc-400 leading-relaxed mt-4 mb-4">{audience.summary}</p>
          <div className="grid grid-cols-2 gap-6 mb-4">
            {[['Demographics', audience.demographics], ['Interests', audience.interests]].map(([title, items]) => (
              <div key={title}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">{title}</p>
                <ul className="space-y-1">
                  {(items || []).map((d, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                      <span className="text-zinc-700 shrink-0 mt-0.5">·</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(categories || []).map((c, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${PRIORITY_PILL[c.priority] ?? PRIORITY_PILL.medium}`} title={c.rationale}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ query, onQuery, statusFilter, onStatusFilter, categoryFilter, onCategoryFilter, categories, selectedCount, onApproveSelected, onRemoveSelected }) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search companies, categories…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={e => onStatusFilter(e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer appearance-none pr-8"
      >
        <option value="">All statuses</option>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      {/* Category filter */}
      <select
        value={categoryFilter}
        onChange={e => onCategoryFilter(e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer appearance-none pr-8"
      >
        <option value="">All categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-zinc-500">{selectedCount} selected</span>
          <button
            onClick={onApproveSelected}
            className="px-3 py-1.5 rounded-lg border border-blue-800 bg-blue-950/60 text-blue-400 text-xs font-medium hover:bg-blue-900/60 transition-colors"
          >
            Approve all
          </button>
          <button
            onClick={onRemoveSelected}
            className="px-3 py-1.5 rounded-lg border border-red-900 bg-red-950/40 text-red-400 text-xs font-medium hover:bg-red-900/40 transition-colors"
          >
            Remove all
          </button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function SponsorDashboard({ sponsors, analysisResult, eventName, city, eventType, sponsorGoals, goBack }) {
  const { leads, update, remove, approve, setStatus, STATUSES } = useLeads(sponsors);
  const { isConnected, isConnecting, connect, disconnect } = useGmail();

  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Derived stats
  const approvedCount  = leads.filter(l => l.outreach_status === 'approved').length;
  const contactedCount = leads.filter(l => ['contacted', 'replied'].includes(l.outreach_status)).length;
  const avgScore       = leads.length ? Math.round(leads.reduce((s, l) => s + (l.fit_score || 0), 0) / leads.length) : 0;
  const categories     = [...new Set(leads.map(l => l.category).filter(Boolean))];

  // Filtered leads
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter(l => {
      const matchQ = !q || (l.company || l.name || '').toLowerCase().includes(q) || (l.category || '').toLowerCase().includes(q);
      const matchS = !statusFilter || l.outreach_status === statusFilter;
      const matchC = !categoryFilter || l.category === categoryFilter;
      return matchQ && matchS && matchC;
    });
  }, [leads, query, statusFilter, categoryFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id));

  const toggleSelect = (id, val) => {
    setSelected(prev => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const selectAll = (val) => {
    setSelected(val ? new Set(filtered.map(l => l.id)) : new Set());
  };

  const approveSelected = () => {
    selected.forEach(id => approve(id));
    setSelected(new Set());
  };

  const removeSelected = () => {
    selected.forEach(id => remove(id));
    setSelected(new Set());
  };

  const noClientId = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-[1200px] mx-auto">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button onClick={goBack} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-4">
              <ArrowLeft size={13} /> Start over
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sponsor Leads</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {[eventName, eventType, city].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-8">
            {noClientId ? (
              <span className="text-[11px] text-zinc-700 px-3 py-1.5 rounded-full border border-zinc-800">
                Add VITE_GOOGLE_CLIENT_ID to enable Gmail
              </span>
            ) : isConnected ? (
              <button onClick={disconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors">
                <Mail size={12} className="text-emerald-400" />
                Gmail connected
              </button>
            ) : (
              <button onClick={connect} disabled={isConnecting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs text-zinc-300 transition-colors">
                <Mail size={12} />
                {isConnecting ? 'Connecting…' : 'Connect Gmail'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Stat label="Total Leads"  value={leads.length}   sub={`${filtered.length} shown`} />
          <Stat label="Approved"     value={approvedCount}  sub="ready for outreach" />
          <Stat label="Contacted"    value={contactedCount} sub="in progress" />
          <Stat label="Avg Fit Score" value={avgScore}      sub="out of 100" />
        </div>

        {/* Audience analysis */}
        {analysisResult?.audience && (
          <AudiencePanel audience={analysisResult.audience} categories={analysisResult.categories} />
        )}

        {/* Toolbar */}
        <Toolbar
          query={query} onQuery={setQuery}
          statusFilter={statusFilter} onStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter} onCategoryFilter={setCategoryFilter}
          categories={categories}
          selectedCount={selected.size}
          onApproveSelected={approveSelected}
          onRemoveSelected={removeSelected}
        />

        {/* Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
          <LeadTableHeader allSelected={allFilteredSelected} onSelectAll={selectAll} />

          <div>
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-zinc-600 text-sm">
                No leads match your filters.
              </div>
            ) : (
              filtered.map(lead => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  selected={selected.has(lead.id)}
                  onSelect={v => toggleSelect(lead.id, v)}
                  onUpdate={patch => update(lead.id, patch)}
                  onApprove={() => approve(lead.id)}
                  onRemove={() => remove(lead.id)}
                  onSetStatus={s => setStatus(lead.id, s)}
                  statuses={STATUSES}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-600">
              {filtered.length} of {leads.length} leads
            </span>
            <div className="flex items-center gap-3 text-[11px] text-zinc-700">
              <span className="flex items-center gap-1"><TrendingUp size={11} /> Click any cell to edit</span>
              <span className="flex items-center gap-1"><CheckCircle size={11} /> Hover to approve or remove</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
