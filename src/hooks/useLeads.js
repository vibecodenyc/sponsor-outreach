import { useState, useCallback } from 'react';

const STATUSES = ['new', 'approved', 'contacted', 'replied', 'declined'];

function enrich(sponsors) {
  return sponsors.map((s, i) => ({
    ...s,
    id: `lead-${i}-${(s.company || s.name || '').replace(/\s+/g, '-')}`,
    outreach_status: 'new',
  }));
}

export function useLeads(initialSponsors = []) {
  const [leads, setLeads] = useState(() => enrich(initialSponsors));

  const update = useCallback((id, patch) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const remove = useCallback((id) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const approve = useCallback((id) => {
    setLeads(prev => prev.map(l =>
      l.id === id
        ? { ...l, outreach_status: l.outreach_status === 'approved' ? 'new' : 'approved' }
        : l
    ));
  }, []);

  const setStatus = useCallback((id, status) => {
    if (STATUSES.includes(status)) update(id, { outreach_status: status });
  }, [update]);

  return { leads, update, remove, approve, setStatus, STATUSES };
}
