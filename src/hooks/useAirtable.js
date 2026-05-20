import { useState, useCallback } from 'react';

const LS_KEY  = 'airtable_api_key';
const LS_BASE = 'airtable_base_id';

function readKey()  { return localStorage.getItem(LS_KEY)  || import.meta.env.VITE_AIRTABLE_API_KEY  || ''; }
function readBase() { return localStorage.getItem(LS_BASE) || import.meta.env.VITE_AIRTABLE_BASE_ID || ''; }

export function useAirtable() {
  const [connected, setConnected] = useState(() => !!(readKey() && readBase()));

  const connect = useCallback((apiKey, baseId) => {
    localStorage.setItem(LS_KEY,  apiKey.trim());
    localStorage.setItem(LS_BASE, baseId.trim());
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_BASE);
    setConnected(false);
  }, []);

  return { connected, connect, disconnect };
}
