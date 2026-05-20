import { useState, useEffect, useCallback } from 'react';

const CLIENT_ID    = import.meta.env.VITE_AIRTABLE_CLIENT_ID;
const REDIRECT_URI = window.location.origin;
const SCOPES       = 'data:records:write data:records:read schema:bases:read';

const LS = {
  token:    'at_token',
  baseId:   'at_base_id',
  baseName: 'at_base_name',
  verifier: 'at_pkce_verifier',
  state:    'at_oauth_state',
};

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function randomString() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sha256b64url(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAirtableOAuth() {
  const [token,    setToken]    = useState(() => localStorage.getItem(LS.token));
  const [baseId,   setBaseId]   = useState(() => localStorage.getItem(LS.baseId)   || import.meta.env.VITE_AIRTABLE_BASE_ID);
  const [baseName, setBaseName] = useState(() => localStorage.getItem(LS.baseName));
  const [bases,    setBases]    = useState([]);
  const [step,     setStep]     = useState('idle'); // idle | authorizing | selecting | done
  const [error,    setError]    = useState(null);

  const connected = !!(
    (token || import.meta.env.VITE_AIRTABLE_API_KEY) && baseId
  );

  // Listen for the code coming back from the OAuth popup
  useEffect(() => {
    const handler = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'at_oauth') return;

      const { code, state } = event.data;
      if (state !== localStorage.getItem(LS.state)) {
        setError('OAuth state mismatch — please try again.');
        setStep('idle');
        return;
      }

      try {
        const res = await fetch('https://airtable.com/oauth2/v1/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type:    'authorization_code',
            code,
            redirect_uri:  REDIRECT_URI,
            client_id:     CLIENT_ID,
            code_verifier: localStorage.getItem(LS.verifier),
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error_description || data.error);

        localStorage.setItem(LS.token, data.access_token);
        setToken(data.access_token);

        // Fetch the user's bases
        const basesRes = await fetch('https://api.airtable.com/v0/meta/bases', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const basesData = await basesRes.json();
        setBases(basesData.bases ?? []);
        setStep('selecting');
      } catch (err) {
        setError(err.message);
        setStep('idle');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const connect = useCallback(async () => {
    if (!CLIENT_ID || CLIENT_ID.includes('your_airtable')) {
      setError('Add VITE_AIRTABLE_CLIENT_ID to your .env file first.');
      return;
    }

    const verifier   = randomString();
    const challenge  = await sha256b64url(verifier);
    const state      = randomString();

    localStorage.setItem(LS.verifier, verifier);
    localStorage.setItem(LS.state,    state);

    const url = new URL('https://airtable.com/oauth2/v1/authorize');
    url.searchParams.set('client_id',             CLIENT_ID);
    url.searchParams.set('redirect_uri',          REDIRECT_URI);
    url.searchParams.set('response_type',         'code');
    url.searchParams.set('scope',                 SCOPES);
    url.searchParams.set('code_challenge',        challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state',                 state);

    setStep('authorizing');
    setError(null);
    window.open(url.toString(), 'at_auth', 'width=560,height=680,left=200,top=100');
  }, []);

  const selectBase = useCallback((id, name) => {
    localStorage.setItem(LS.baseId,   id);
    localStorage.setItem(LS.baseName, name);
    setBaseId(id);
    setBaseName(name);
    setStep('done');
  }, []);

  const disconnect = useCallback(() => {
    Object.values(LS).forEach(k => localStorage.removeItem(k));
    setToken(null);
    setBaseId(null);
    setBaseName(null);
    setBases([]);
    setStep('idle');
    setError(null);
  }, []);

  return { connected, token, baseId, baseName, bases, step, error, connect, selectBase, disconnect };
}
