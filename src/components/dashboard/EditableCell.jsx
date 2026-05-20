import React, { useState, useRef, useEffect } from 'react';

/**
 * Click-to-edit cell. Supports single-line (input) and multi-line (textarea).
 * Saves on blur or Enter (single-line). Cancels on Escape.
 */
export function EditableCell({ value, onChange, multiline = false, className = '', placeholder = '—' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  const baseInput = `w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-white
    focus:outline-none focus:border-zinc-400 resize-none`;

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref}
        rows={3}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Escape' && cancel()}
        className={`${baseInput} leading-relaxed`}
      />
    ) : (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        }}
        className={baseInput}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`cursor-text hover:text-white transition-colors ${className}`}
    >
      {value || <span className="text-zinc-700">{placeholder}</span>}
    </span>
  );
}
