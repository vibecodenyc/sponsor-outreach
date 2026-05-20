import React, { useEffect } from 'react';
import FindSponsors from './pages/FindSponsors';
import SponsorDashboard from './pages/SponsorDashboard';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const state = useAppState();

  // Handle Airtable OAuth popup callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const ostate = params.get('state');
    if (code && ostate && window.opener) {
      window.opener.postMessage(
        { type: 'at_oauth', code, state: ostate },
        window.location.origin
      );
      window.close();
    }
    if (code || ostate) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1f1f1f 1px, transparent 1px), linear-gradient(to bottom, #1f1f1f 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {state.step === 'upload' ? (
        <FindSponsors {...state} />
      ) : (
        <SponsorDashboard {...state} />
      )}
    </div>
  );
}
