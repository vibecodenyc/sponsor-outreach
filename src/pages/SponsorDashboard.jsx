import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Download, ChevronDown, ChevronUp, Users, Check, X, Mail } from 'lucide-react';
import { CategoryGroup } from '../components/dashboard/CategoryGroup';
import { useLeads } from '../hooks/useLeads';
import { useGmail } from '../hooks/useGmail';
import { useAirtable } from '../hooks/useAirtable';
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

// ── Airtable connect button ───────────────────────────────────────────────────

function AirtableButton({ connected, onConnect, onDisconnect }) {
  const [open, setOpen]     = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseId, setBaseId] = useState('');

  if (connected) {
    return (
      <button
        onClick={onDisconnect}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-yellow-700/60 bg-yellow-950/40 hover:bg-yellow-950/70 text-yellow-400 text-xs font-medium transition-colors"
      >
        <Check size={12} />
        Airtable connected
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-bold transition-colors"
      >
        Connect Airtable
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white">Connect Airtable</p>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-400"><X size={14} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="pat..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Base ID</label>
              <input type="text" value={baseId} onChange={e => setBaseId(e.target.value)} placeholder="app..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
            </div>
            <button
              onClick={() => { onConnect(apiKey, baseId); setOpen(false); setApiKey(''); setBaseId(''); }}
              disabled={!apiKey.trim() || !baseId.trim()}
              className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 text-xs font-bold transition-colors"
            >
              Save
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-3 leading-relaxed">
            Get your API key at airtable.com/create/tokens · Base ID starts with "app"
          </p>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function SponsorDashboard({ sponsors, analysisResult, eventName, city, eventType, sponsorGoals, goBack }) {
  const { leads } = useLeads(sponsors);
  const { accessToken, isConnected: gmailConnected, isConnecting, connect: gmailConnect, disconnect: gmailDisconnect } = useGmail();
  const { connected: airtableConnected, connect: airtableConnect, disconnect: airtableDisconnect } = useAirtable();

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

          <div className="flex items-center gap-2 mt-8">
            <AirtableButton
              connected={airtableConnected}
              onConnect={airtableConnect}
              onDisconnect={airtableDisconnect}
            />
            {gmailConnected ? (
              <button onClick={gmailDisconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-800/60 bg-red-950/40 hover:bg-red-950/70 text-red-400 text-xs font-medium transition-colors">
                <Check size={12} />
                Gmail connected
              </button>
            ) : (
              <button onClick={gmailConnect} disabled={isConnecting} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EA4335] hover:bg-[#c5392d] disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                <Mail size={12} />
                {isConnecting ? 'Connecting…' : 'Connect Gmail'}
              </button>
            )}
          </div>
        </div>

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
              accessToken={accessToken}
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
