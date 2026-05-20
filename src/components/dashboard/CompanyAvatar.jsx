import React from 'react';

const PALETTES = [
  'bg-blue-900/80   text-blue-300',
  'bg-violet-900/80 text-violet-300',
  'bg-emerald-900/80 text-emerald-300',
  'bg-amber-900/80  text-amber-300',
  'bg-rose-900/80   text-rose-300',
  'bg-cyan-900/80   text-cyan-300',
  'bg-indigo-900/80 text-indigo-300',
  'bg-fuchsia-900/80 text-fuchsia-300',
];

export function CompanyAvatar({ name = '' }) {
  const idx = [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTES.length;
  return (
    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${PALETTES[idx]}`}>
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
