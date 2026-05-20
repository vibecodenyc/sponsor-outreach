import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp, Send, AlertCircle, Pencil, X } from 'lucide-react';
import { CompanyAvatar } from './CompanyAvatar';
import { FitBar } from './FitBar';
import { generateCategorySequence } from '../../services/outreach';
import { queueOutreachEmails } from '../../services/airtable';

// ── Time / day options ────────────────────────────────────────────────────────

const DAY_OPTIONS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,21,30];

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const label = new Date(2000, 0, 1, h, m)
        .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      opts.push({ label, value });
    }
  }
  return opts;
})();

const DEFAULT_SCHEDULE = {
  outreach:   { day: 0,  time: '09:00' },
  followup_1: { day: 4,  time: '10:00' },
  followup_2: { day: 9,  time: '14:00' },
};

function computeSendTime(day, time) {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const send = new Date(now);
  send.setDate(now.getDate() + day);
  send.setHours(h, m, 0, 0);
  return send;
}

function formatSendTime(day, time) {
  const d = computeSendTime(day, time);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Placeholder replacement ───────────────────────────────────────────────────

function fillPlaceholders(text, lead) {
  const firstName = (lead.contact || '').split(' ')[0] || 'there';
  const lastName  = (lead.contact || '').split(' ').slice(1).join(' ') || '';
  return text
    .replace(/FIRST_NAME/g,   firstName)
    .replace(/LAST_NAME/g,    lastName)
    .replace(/COMPANY_NAME/g, lead.company || lead.name || '')
    .replace(/THEIR_TITLE/g,  lead.title || 'your team')
    .replace(/YOUR_NAME/g,    '');
}

// ── Token highlighter ─────────────────────────────────────────────────────────

const TOKENS = ['FIRST_NAME', 'LAST_NAME', 'COMPANY_NAME', 'THEIR_TITLE', 'YOUR_NAME'];
const TOKEN_RE = new RegExp(`(${TOKENS.join('|')})`, 'g');

function HighlightedBody({ text }) {
  const parts = text.split(TOKEN_RE);
  return (
    <pre className="whitespace-pre-wrap text-sm font-sans text-zinc-400 leading-relaxed">
      {parts.map((part, i) =>
        TOKENS.includes(part)
          ? <span key={i} className="text-amber-400 font-semibold bg-amber-950/30 rounded px-0.5">{part}</span>
          : part
      )}
    </pre>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors text-[11px] shrink-0">
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Email card ────────────────────────────────────────────────────────────────

const STAGE_STYLE = {
  outreach:   { badge: 'bg-blue-950/60 border-blue-800 text-blue-400',    dot: 'bg-blue-400'  },
  followup_1: { badge: 'bg-amber-950/60 border-amber-800 text-amber-400', dot: 'bg-amber-400' },
  followup_2: { badge: 'bg-zinc-800 border-zinc-700 text-zinc-400',       dot: 'bg-zinc-500'  },
};

function EmailCard({ email, schedule, onScheduleChange, onEdit }) {
  const style = STAGE_STYLE[email.type] ?? STAGE_STYLE.followup_2;
  const { day, time } = schedule;
  const [editing, setEditing] = useState(false);
  const [draftSubject, setDraftSubject] = useState(email.subject);
  const [draftBody, setDraftBody]       = useState(email.body);

  // Sync drafts if parent email changes (e.g. regenerated)
  useEffect(() => { setDraftSubject(email.subject); setDraftBody(email.body); }, [email.subject, email.body]);

  const saveEdit = () => { onEdit({ subject: draftSubject, body: draftBody }); setEditing(false); };
  const cancelEdit = () => { setDraftSubject(email.subject); setDraftBody(email.body); setEditing(false); };

  const full = `Subject: ${email.subject}\n\n${email.body}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${style.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {email.label}
        </span>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button onClick={saveEdit} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-zinc-950 text-[11px] font-semibold hover:bg-zinc-100 transition-colors">
                <Check size={11} /> Save
              </button>
              <button onClick={cancelEdit} className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-500 transition-colors">
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors">
                <Pencil size={11} /> Edit
              </button>
              <CopyBtn text={full} />
            </>
          )}
        </div>
      </div>

      {/* Schedule pickers */}
      <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/60">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Send time</p>
        <div className="flex gap-2">
          <select value={day} onChange={e => onScheduleChange({ day: Number(e.target.value), time })}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer appearance-none">
            {DAY_OPTIONS.map(d => <option key={d} value={d}>Day {d}</option>)}
          </select>
          <select value={time} onChange={e => onScheduleChange({ day, time: e.target.value })}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer appearance-none">
            {TIME_OPTIONS.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <p className="text-[11px] text-zinc-600 mt-1.5">→ {formatSendTime(day, time)}</p>
      </div>

      {editing ? (
        /* Edit mode */
        <div className="px-4 py-4 space-y-3 flex-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Subject</p>
            <input
              type="text"
              value={draftSubject}
              onChange={e => setDraftSubject(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Body</p>
            <textarea
              value={draftBody}
              onChange={e => setDraftBody(e.target.value)}
              rows={10}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white leading-relaxed focus:outline-none focus:border-zinc-500 transition-colors resize-none font-sans"
            />
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Subject</p>
            <HighlightedBody text={email.subject} />
          </div>
          <div className="px-4 pt-2 pb-4 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Body</p>
            <HighlightedBody text={email.body} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Category group ────────────────────────────────────────────────────────────

export function CategoryGroup({
  category, leads, sequence, onSequenceGenerated,
  eventName, eventType, city, sponsorGoals, categoryRationale,
  airtableConnected, defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [edits, setEdits] = useState({});

  const editEmail = (type, patch) =>
    setEdits(prev => ({ ...prev, [type]: { ...(prev[type] || {}), ...patch } }));

  const effectiveSequence = sequence
    ? sequence.map(e => ({ ...e, ...(edits[e.type] || {}) }))
    : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [pushState, setPushState] = useState('idle');
  const [pushError, setPushError] = useState(null);
  const [pushResults, setPushResults] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const emails = await generateCategorySequence({
        eventName, eventType, city, sponsorGoals, category, categoryRationale,
      });
      onSequenceGenerated(emails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (type, patch) =>
    setSchedule(prev => ({ ...prev, [type]: { ...prev[type], ...patch } }));

  const pushEmails = async () => {
    if (!effectiveSequence) return;
    setPushState('pushing');
    setPushError(null);

    try {
      const emailsToQueue = [];

      for (const lead of leads) {
        for (const email of effectiveSequence) {
          const sched    = schedule[email.type] ?? DEFAULT_SCHEDULE[email.type];
          const sendTime = computeSendTime(sched.day, sched.time);

          emailsToQueue.push({
            leadName:  lead.contact || lead.company || lead.name,
            company:   lead.company || lead.name,
            category,
            eventName: eventName || '',
            to:        lead.email,
            subject:   fillPlaceholders(email.subject, lead),
            body:      fillPlaceholders(email.body,    lead),
            sendAt:    sendTime.toISOString(),
            stage:     email.label,
          });
        }
      }

      if (airtableConnected) {
        await queueOutreachEmails(emailsToQueue);
      }

      setPushResults({ total: emailsToQueue.length });
      setPushState('done');
    } catch (err) {
      setPushError(err.message);
      setPushState('error');
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      {/* Category header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">{category}</span>
          <span className="text-[11px] text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          </span>
          {pushState === 'done' && (
            <span className="text-[11px] text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Pushed to Gmail
            </span>
          )}
          {effectiveSequence && pushState === 'idle' && (
            <span className="text-[11px] text-blue-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Sequence ready
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
      </button>

      {open && (
        <div className="border-t border-zinc-800">
          {/* Lead list */}
          <div className="divide-y divide-zinc-800/60">
            {leads.map(lead => (
              <div key={lead.id} className="grid items-center gap-4 px-5 py-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 80px' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <CompanyAvatar name={lead.company || lead.name} />
                  <span className="text-sm font-semibold text-white truncate">{lead.company || lead.name}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{lead.contact || '—'}</p>
                  <p className="text-[11px] text-zinc-600 truncate">{lead.title}</p>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono truncate">{lead.email}</p>
                <FitBar score={lead.fit_score} />
              </div>
            ))}
          </div>

          {/* Sequence section */}
          <div className="border-t border-zinc-800 px-5 py-5">
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

            {!effectiveSequence && !loading && (
              <button
                onClick={generate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                <Sparkles size={14} />
                Generate outreach sequence for {category}
              </button>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <RefreshCw size={14} className="animate-spin" />
                Writing sequence…
              </div>
            )}

            {effectiveSequence && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                    Outreach Template · {category}
                  </p>
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <RefreshCw size={11} />
                    Regenerate
                  </button>
                </div>

                {/* Email cards with schedule pickers */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {effectiveSequence.map(email => (
                    <EmailCard
                      key={email.stage}
                      email={email}
                      schedule={schedule[email.type] ?? DEFAULT_SCHEDULE[email.type]}
                      onScheduleChange={patch => updateSchedule(email.type, patch)}
                      onEdit={patch => editEmail(email.type, patch)}
                    />
                  ))}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        {airtableConnected
                          ? <>Emails are saved to <strong className="text-zinc-400">Airtable › Outreach Queue</strong>. Your Airtable Automation will send them at the scheduled times. Review, edit or cancel any record in Airtable before it sends.</>
                          : <>Connect Airtable (top right) to queue emails for automated sending.</>
                        }
                      </p>
                    </div>

                    {pushState === 'done' && pushResults && (
                      <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs">
                        {pushResults.total} email{pushResults.total > 1 ? 's' : ''} queued in Airtable.
                      </div>
                    )}

                    {pushState === 'error' && pushError && (
                      <p className="text-xs text-red-400 mb-3">{pushError}</p>
                    )}

                    <button
                      onClick={pushEmails}
                      disabled={pushState === 'pushing' || !airtableConnected}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                    >
                      {pushState === 'pushing' ? (
                        <><RefreshCw size={14} className="animate-spin" /> Queueing…</>
                      ) : airtableConnected ? (
                        <><Send size={14} /> Queue in Airtable — {leads.length} lead{leads.length > 1 ? 's' : ''}</>
                      ) : (
                        <span className="text-xs text-zinc-500">Connect Airtable to enable</span>
                      )}
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
