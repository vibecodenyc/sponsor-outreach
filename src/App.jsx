import React from 'react';
import FindSponsors from './pages/FindSponsors';
import SponsorDashboard from './pages/SponsorDashboard';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const state = useAppState();

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
