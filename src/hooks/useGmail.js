import { useState, useCallback, useRef, useEffect } from 'react';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ');

export function useGmail() {
  const [accessToken, setAccessToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const clientRef = useRef(null);

  const initClient = useCallback(() => {
    if (clientRef.current || !window.google?.accounts?.oauth2) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    clientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        setIsConnecting(false);
        if (resp.access_token) setAccessToken(resp.access_token);
      },
      error_callback: () => setIsConnecting(false),
    });
  }, []);

  useEffect(() => {
    if (window.google?.accounts?.oauth2) {
      initClient();
      return;
    }
    const id = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        initClient();
        clearInterval(id);
      }
    }, 300);
    return () => clearInterval(id);
  }, [initClient]);

  const connect = useCallback(() => {
    initClient();
    if (!clientRef.current) return;
    setIsConnecting(true);
    clientRef.current.requestAccessToken();
  }, [initClient]);

  const disconnect = useCallback(() => {
    if (accessToken) window.google?.accounts.oauth2.revoke(accessToken, () => {});
    setAccessToken(null);
    clientRef.current = null;
  }, [accessToken]);

  return { accessToken, isConnected: !!accessToken, isConnecting, connect, disconnect };
}
