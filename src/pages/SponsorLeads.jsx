import React, { useState } from 'react';
import { Check, Mail, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { SponsorRow } from '../components/leads/SponsorRow';
import { useGmail } from '../hooks/useGmail';
import { useSequenceProgress } from '../hooks/useSequenceProgress';

const PRIORITY_STYLES = {
  high:   'bg-emerald-950/60 border-emerald-800/60 text-emerald-400',
  medium: 'bg-amber-950/60  border-amber-800/60  text-amber-400',
  low:    'bg-zinc-900      border-zinc-700       text-zinc-500',
};

function AudiencePanel({ audience, categories }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users size={14} className="text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Audience Analysis</span>
          {audience.estimated_size && (
            <span className="text-xs text-zinc-600 ml-1">· {audience.estimated_size}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800">
          <p className="text-sm text-zinc-400 leading-relaxed mt-4 mb-4">{audience.summary}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Demographics</p>
              <ul className="space-y-1">
                {audience.demographics.map((d, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="text-zinc-700 mt-1">·</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Interests</p>
              <ul className="space-y-1">
                {audience.interests.map((interest, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="text-zinc-700 mt-1">·</span>{interest}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Sponsor Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${PRIORITY_STYLES[cat.priority] ?? PRIORITY_STYLES.medium}`}
                  title={cat.rationale}
                >
                  <span className="font-medium">{cat.name}</span>
                  <span className="opacity-60 capitalize">{cat.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SponsorLeads({ sponsors, analysisResult, eventName, city, eventType, sponsorGoals, goBack }) {
  const { accessToken, isConnected, isConnecting, connect, disconnect } = useGmail();
  const { sequences, startSequence, markReplied } = useSequenceProgress();
  const noClientId = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button onClick={goBack} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 flex items-center gap-1">
              ← Start over
            </button>
            <h1 className="text-3xl font-bold text-white">{sponsors.length} Sponsor Leads</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {[eventName, eventType, city].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-medium">
              <Check size={12} />
              AI Generated
            </div>

            {noClientId ? (
              <div className="text-xs text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-800">
                Add VITE_GOOGLE_CLIENT_ID to enable Gmail
              </div>
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

        {/* Audience + category analysis */}
        {analysisResult?.audience && (
          <AudiencePanel
            audience={analysisResult.audience}
            categories={analysisResult.categories ?? []}
          />
        )}

        {/* Table header */}
        <div
          className="grid gap-3 px-5 py-3 mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600"
          style={{ gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr 36px auto auto' }}
        >
          <span>Company</span>
          <span>Contact</span>
          <span>Title</span>
          <span>Email</span>
          <span>Fit</span>
          <span>Sequence</span>
          <span className="w-[72px]" />
        </div>

        <div className="space-y-2">
          {sponsors.map((sponsor, i) => (
            <SponsorRow
              key={`${sponsor.company ?? sponsor.name}-${i}`}
              sponsor={sponsor}
              eventName={eventName}
              city={city}
              eventType={eventType}
              sponsorGoals={sponsorGoals}
              gmailConnected={isConnected}
              accessToken={accessToken}
              progress={sequences[sponsor.email] ?? null}
              onSequenceStarted={startSequence}
              onMarkReplied={markReplied}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
