import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Download, ChevronDown, ChevronUp, Users, Check, X, Database, ChevronRight } from 'lucide-react';
import { CategoryGroup } from '../components/dashboard/CategoryGroup';
import { useLeads } from '../hooks/useLeads';
import { useAirtableOAuth } from '../hooks/useAirtableOAuth';
import { exportLeadsCSV } from '../services/export';

// ── Audience panel ────────────────────────────────────────────────────────────

const PRIORITY_PILL = {
  high:   'bg-emerald-950/60 border-emerald-800 text-emerald-400',
  medium: 'bg-amber-950/60  border-amber-800  text-amber-400',
  low:    'bg-zinc-900      border-zinc-700   text-zinc-500',
};

function AudiencePanel({ audience, categories }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mb-6 overflow-hidden">
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

// ── Airtable connection banner ────────────────────────────────────────────────

function AirtableBanner({ step, error, bases, baseName, connected, onConnect, onSelectBase, onDisconnect }) {
  if (connected) {
    return (
      <div className="flex items-center justify-between px-5 py-3 mb-6 rounded-xl border border-yellow-800/40 bg-yellow-950/20">
        <div className="flex items-center gap-2">
          <Check size={13} className="text-yellow-400" />
          <span className="text-xs text-yellow-300 font-medium">Airtable connected</span>
          {baseName && <span className="text-xs text-yellow-600">· {baseName}</span>}
        </div>
        <button onClick={onDisconnect} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
          Disconnect
        </button>
      </div>
    );
  }

  if (step === 'selecting' && bases.length > 0) {
    return (
      <div className="px-5 py-4 mb-6 rounded-xl border border-yellow-800/50 bg-yellow-950/20">
        <p className="text-xs font-semibold text-yellow-300 mb-3">
          Select the Airtable base where outreach emails will be queued:
        </p>
        <div className="space-y-1.5">
          {bases.map(base => (
            <button
              key={base.id}
              onClick={() => onSelectBase(base.id, base.name)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:border-yellow-700/60 hover:bg-yellow-950/30 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Database size={13} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
                <span className="text-sm text-white">{base.name}</span>
              </div>
              <ChevronRight size={13} className="text-zinc-600 group-hover:text-yellow-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 mb-6 rounded-xl border border-zinc-700 bg-zinc-900/60">
      <div>
        <p className="text-sm font-semibold text-white mb-0.5">Connect Airtable to send outreach</p>
        <p className="text-xs text-zinc-500">Log in and select a base — your sequences queue there automatically.</p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={onConnect}
        disabled={step === 'authorizing'}
        className="shrink-0 ml-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 text-xs font-bold transition-colors"
      >
        {step === 'authorizing' ? 'Opening…' : 'Connect Airtable →'}
      </button>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function SponsorDashboard({ sponsors, analysisResult, eventName, city, eventType, sponsorGoals, goBack }) {
  const { leads } = useLeads(sponsors);
  const {
    connected: airtableConnected,
    baseName, bases, step: airtableStep, error: airtableError,
    connect: airtableConnect, selectBase, disconnect: airtableDisconnect,
  } = useAirtableOAuth();

  const [query, setQuery] = useState('');
  const [sequences, setSequences] = useState({});

  const saveSequence = (category, emails) =>
    setSequences(prev => ({ ...prev, [category]: emails }));

  const grouped = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = leads.filter(l =>
      !q ||
      (l.company || l.name || '').toLowerCase().includes(q) ||
      (l.contact || '').toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q)
    );
    return filtered.reduce((acc, lead) => {
      const cat = lead.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(lead);
      return acc;
    }, {});
  }, [leads, query]);

  const categoryRationale = useMemo(() => {
    const map = {};
    (analysisResult?.categories || []).forEach(c => { map[c.name] = c.rationale; });
    return map;
  }, [analysisResult]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
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

          <div />
        </div>

        {/* Airtable connection banner */}
        <AirtableBanner
          step={airtableStep}
          error={airtableError}
          bases={bases}
          baseName={baseName}
          connected={airtableConnected}
          onConnect={airtableConnect}
          onSelectBase={selectBase}
          onDisconnect={airtableDisconnect}
        />

        {/* Audience analysis */}
        {analysisResult?.audience && (
          <AudiencePanel audience={analysisResult.audience} categories={analysisResult.categories} />
        )}

        {/* Search + export */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies, contacts, categories…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          <button
            onClick={() => exportLeadsCSV(leads, sequences, eventName)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors shrink-0"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>

        {/* Category groups */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryLeads], index) => (
            <CategoryGroup
              key={category}
              category={category}
              leads={categoryLeads}
              sequence={sequences[category] ?? null}
              onSequenceGenerated={emails => saveSequence(category, emails)}
              eventName={eventName}
              eventType={eventType}
              city={city}
              sponsorGoals={sponsorGoals}
              categoryRationale={categoryRationale[category]}
              airtableConnected={airtableConnected}
              defaultOpen={index === 0}
            />
          ))}

          {Object.keys(grouped).length === 0 && (
            <div className="py-16 text-center text-zinc-600 text-sm">No leads match your search.</div>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-6">
          {leads.length} leads · {Object.keys(grouped).length} categories
        </p>
      </div>
    </div>
  );
}
