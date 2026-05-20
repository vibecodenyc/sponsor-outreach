import React, { useState, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { EmailCard } from './EmailCard';
import { FollowupCard } from './FollowupCard';
import { SequencePill } from './SequencePill';
import { SequenceTimeline } from './SequenceTimeline';
import { generateOutreachEmail, generateFollowupSequence } from '../../services/anthropic';
import { gmailCreateDraft } from '../../services/gmail';
import { targetDateLong } from '../../lib/utils';

export function SponsorRow({ sponsor, eventName, city, eventType, sponsorGoals, gmailConnected, accessToken, progress, onSequenceStarted, onMarkReplied }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('outreach');
  const [outreach, setOutreach] = useState(null);
  const [followup, setFollowup] = useState(null);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [loadingFollowup, setLoadingFollowup] = useState(false);
  const [startingSequence, setStartingSequence] = useState(false);
  const [sequenceError, setSequenceError] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const fetchOutreach = useCallback(async () => {
    if (outreach || loadingOutreach) return;
    setLoadingOutreach(true);
    try {
      const result = await generateOutreachEmail({ sponsor, eventName, city, eventType, sponsorGoals });
      setOutreach(result);
    } catch {
      setOutreach({ subject: 'Error generating email', body: 'Could not generate email. Check your API key.' });
    } finally {
      setLoadingOutreach(false);
    }
  }, [outreach, loadingOutreach, sponsor, eventName, city, eventType, sponsorGoals]);

  const fetchFollowup = useCallback(async () => {
    if (followup || loadingFollowup) return;
    setLoadingFollowup(true);
    try {
      const result = await generateFollowupSequence({ sponsor, eventName, city, eventType, sponsorGoals });
      setFollowup(result.emails || []);
    } catch {
      setFollowup([]);
    } finally {
      setLoadingFollowup(false);
    }
  }, [followup, loadingFollowup, sponsor, eventName, city, eventType, sponsorGoals]);

  const handleExpand = () => {
    if (!expanded) fetchOutreach();
    setExpanded((v) => !v);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'followup' && !progress) fetchFollowup();
  };

  const handleStartSequence = async () => {
    setSequenceError(null);
    setStartingSequence(true);
    try {
      let outreachEmail = outreach;
      let followupEmails = followup;

      if (!outreachEmail) {
        const r = await generateOutreachEmail({ sponsor, eventName, city, eventType, sponsorGoals });
        setOutreach(r);
        outreachEmail = r;
      }
      if (!followupEmails) {
        const r = await generateFollowupSequence({ sponsor, eventName, city, eventType, sponsorGoals });
        const emails = r.emails || [];
        setFollowup(emails);
        followupEmails = emails;
      }

      const now = Date.now();

      await gmailCreateDraft({ to: sponsor.email, subject: outreachEmail.subject, body: outreachEmail.body, accessToken });

      for (const email of followupEmails) {
        const sendOn = targetDateLong(now, email.day);
        const bodyWithNote = `[Gmail draft — send on or after ${sendOn} (Day ${email.day} follow-up)]\n\n${email.body}`;
        await gmailCreateDraft({ to: sponsor.email, subject: email.subject, body: bodyWithNote, accessToken });
      }

      onSequenceStarted(sponsor.email, { startedAt: now });
      setActiveTab('followup');
      if (!expanded) setExpanded(true);
    } catch (err) {
      setSequenceError(err.message);
    } finally {
      setStartingSequence(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(sponsor.email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const sequenceStarted = !!progress;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Collapsed row */}
      <div className="grid items-center gap-3 px-5 py-4" style={{ gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr 36px auto auto' }}>
        <div className="min-w-0">
          <span className="text-sm font-bold text-white truncate block">{sponsor.company || sponsor.name}</span>
          {sponsor.category && (
            <span className="text-[11px] text-zinc-600 truncate block">{sponsor.category}</span>
          )}
        </div>
        <span className="text-sm text-zinc-300 truncate">{sponsor.contact}</span>
        <span className="text-sm text-zinc-400 truncate">{sponsor.title}</span>
        <span className="text-xs text-zinc-500 truncate font-mono">{sponsor.email}</span>

        {/* Fit score */}
        {sponsor.fit_score > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                sponsor.fit_score >= 80 ? 'bg-emerald-400' :
                sponsor.fit_score >= 60 ? 'bg-amber-400' : 'bg-zinc-500'
              }`}
            />
            <span className={`text-xs font-semibold tabular-nums ${
              sponsor.fit_score >= 80 ? 'text-emerald-400' :
              sponsor.fit_score >= 60 ? 'text-amber-400' : 'text-zinc-500'
            }`}>
              {sponsor.fit_score}
            </span>
          </div>
        )}

        <div className="flex items-center">
          {sequenceStarted ? (
            <SequencePill progress={progress} />
          ) : gmailConnected ? (
            <button
              onClick={handleStartSequence}
              disabled={startingSequence}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50 text-xs text-zinc-300 transition-colors whitespace-nowrap"
            >
              <Mail size={11} />
              {startingSequence ? 'Creating drafts…' : 'Start Sequence'}
            </button>
          ) : (
            <span className="text-xs text-zinc-700">Connect Gmail</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyEmail} className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400">
            {emailCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <button onClick={handleExpand} className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {sequenceError && (
        <div className="mx-5 mb-3 px-4 py-2 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-xs">
          {sequenceError}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-800 px-5 pb-5 pt-4">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">AI Rationale</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{sponsor.rationale}</p>
          </div>

          <div className="flex gap-1 mb-4 border-b border-zinc-800">
            {['outreach', 'followup'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {tab === 'outreach' ? 'Outreach Email' : 'Follow-up Sequence'}
              </button>
            ))}
          </div>

          {activeTab === 'outreach' && (
            <div className="space-y-4">
              {loadingOutreach ? (
                <div className="text-sm text-zinc-500 py-6 text-center">Generating outreach email…</div>
              ) : outreach ? (
                <EmailCard email={outreach} />
              ) : null}
              {gmailConnected && !sequenceStarted && outreach && !startingSequence && (
                <button onClick={handleStartSequence} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors">
                  <Mail size={15} />
                  Create Gmail drafts for full sequence
                </button>
              )}
              {startingSequence && <p className="text-sm text-zinc-500">Creating Gmail drafts…</p>}
            </div>
          )}

          {activeTab === 'followup' && (
            <div>
              {sequenceStarted ? (
                <SequenceTimeline progress={progress} sponsor={sponsor} accessToken={accessToken} onMarkReplied={onMarkReplied} />
              ) : loadingFollowup ? (
                <div className="text-sm text-zinc-500 py-6 text-center">Generating follow-up sequence…</div>
              ) : followup ? (
                <div className="space-y-4">
                  {followup.map((email) => <FollowupCard key={email.day} email={email} />)}
                  {gmailConnected && (
                    <button onClick={handleStartSequence} disabled={startingSequence} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors">
                      <Mail size={15} />
                      {startingSequence ? 'Creating drafts…' : 'Create Gmail drafts for full sequence'}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
