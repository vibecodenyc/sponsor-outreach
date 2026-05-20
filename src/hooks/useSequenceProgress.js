import { useState, useCallback } from 'react';

const KEY = 'spo_sequences_v1';

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
};

const persist = (d) => localStorage.setItem(KEY, JSON.stringify(d));

export function useSequenceProgress() {
  const [sequences, setSequences] = useState(load);

  const upsert = useCallback((email, patch) => {
    setSequences((prev) => {
      const next = { ...prev, [email]: { ...prev[email], ...patch } };
      persist(next);
      return next;
    });
  }, []);

  const startSequence = useCallback((email, info) => {
    upsert(email, { startedAt: Date.now(), replied: false, ...info });
  }, [upsert]);

  const markReplied = useCallback((email) => {
    upsert(email, { replied: true });
  }, [upsert]);

  return { sequences, startSequence, markReplied };
}
