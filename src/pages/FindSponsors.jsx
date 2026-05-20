import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, Check, FileSearch } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { runSponsorAnalysis } from '../services/analysis';
import { CITIES, EVENT_TYPES } from '../lib/constants';
import { parseDocument } from '../lib/parsers/index';

// ── File type config ──────────────────────────────────────────────────────────

const ACCEPTED = { pdf: 'PDF', pptx: 'PPTX', ppt: 'PPTX', docx: 'DOCX' };

const FILE_TYPE_COLORS = {
  PDF:  { dot: 'bg-red-400',    label: 'text-red-400',    border: 'border-red-900/60'  },
  PPTX: { dot: 'bg-orange-400', label: 'text-orange-400', border: 'border-orange-900/60' },
  DOCX: { dot: 'bg-blue-400',   label: 'text-blue-400',   border: 'border-blue-900/60'  },
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Upload zone ───────────────────────────────────────────────────────────────

function UploadZone({ fileName, fileType, fileSize, uploadState, progress, onFile, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFile(e.dataTransfer.files?.[0]);
  };

  const typeColors = FILE_TYPE_COLORS[fileType] || {};

  // Complete state
  if (uploadState === 'complete') {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0">
          <Check size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{fileName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[11px] font-bold ${typeColors.label}`}>{fileType}</span>
            <span className="text-zinc-600 text-[11px]">·</span>
            <span className="text-zinc-500 text-[11px]">{fileSize}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // Uploading state
  if (uploadState === 'uploading') {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{fileName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Uploading…</p>
          </div>
          <span className="text-sm font-semibold text-zinc-400 tabular-nums shrink-0">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full progress-shimmer transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Idle / drag-over state
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
        dragOver
          ? 'border-zinc-500 bg-zinc-800/50 shadow-[0_0_30px_rgba(255,255,255,0.03)]'
          : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.pptx,.ppt,.docx"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="px-8 py-10 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
          <Upload size={20} className="text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-300">
          {dragOver ? 'Release to upload' : <>Drop your event brief here, or <span className="underline underline-offset-2">browse</span></>}
        </p>
        <p className="text-xs text-zinc-600 mt-1">PDF, PPTX, DOCX — optional but recommended</p>
      </div>
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, ...rest }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all"
      {...rest}
    />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FindSponsors({
  fileContent, setFileContent,
  fileName, setFileName,
  parsedDoc, setParsedDoc,
  eventName, setEventName,
  eventType, setEventType,
  city, setCity,
  sponsorGoals, setSponsorGoals,
  setSponsors,
  setAnalysisResult,
  goToResults,
  loading, setLoading,
  error, setError,
  clearError,
}) {
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | parsing | complete
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parseError, setParseError] = useState(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const typeLabel = ACCEPTED[ext];

    if (!typeLabel) {
      setError('Please upload a PDF, PPTX, or DOCX file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File must be under 20 MB.');
      return;
    }

    clearError();
    setParseError(null);
    setParsedDoc(null);
    setFileName(file.name);
    setFileType(typeLabel);
    setFileSize(formatBytes(file.size));
    setUploadState('uploading');
    setUploadProgress(0);

    // Animate progress to 80% while parsing runs concurrently
    const startTime = Date.now();
    const animDuration = 1000 + Math.random() * 400;
    const tick = () => {
      const pct = Math.min(80, ((Date.now() - startTime) / animDuration) * 80);
      setUploadProgress(pct);
      if (pct < 80) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Parse the document
    let parsed = null;
    try {
      parsed = await parseDocument(file);
      setFileContent(parsed.raw);
      setParsedDoc(parsed);
    } catch (err) {
      // Non-fatal: file stored but not parsed (e.g. PPTX/DOCX stubs)
      setParseError(err.message);
      setFileContent(`[Uploaded: ${file.name}]`);
    }

    setUploadProgress(100);
    setUploadState('complete');
  }, [clearError, setError, setFileName, setFileContent, setParsedDoc]);

  const handleRemove = () => {
    setFileName('');
    setFileContent('');
    setFileType('');
    setFileSize('');
    setParsedDoc(null);
    setParseError(null);
    setUploadState('idle');
    setUploadProgress(0);
    setPreviewExpanded(false);
  };

  const canGenerate = eventName.trim() && eventType && city;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    clearError();
    try {
      const result = await runSponsorAnalysis({
        eventName,
        eventType,
        city,
        sponsorGoals,
        rawText: parsedDoc?.raw ?? '',
      });
      setAnalysisResult(result);
      setSponsors(result.sponsors);
      goToResults();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[600px]">

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold leading-tight tracking-tight mb-4">
            Find your<br />
            <span className="text-zinc-500">perfect sponsors.</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            Upload your event brief to identify the most aligned sponsors,
            craft personalized outreach, and build your follow-up sequence — all in seconds.
          </p>
        </div>

        <ErrorBanner message={error} />

        <div className="space-y-4">

          {/* Upload */}
          <div>
            <Label>Event Brief / Sponsorship Deck</Label>
            <UploadZone
              fileName={fileName}
              fileType={fileType}
              fileSize={fileSize}
              uploadState={uploadState}
              progress={uploadProgress}
              onFile={handleFile}
              onRemove={handleRemove}
            />
          </div>

          {/* Extracted content preview */}
          {parsedDoc && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileSearch size={14} className="text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Extracted Content</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-600">
                    {parsedDoc.wordCount.toLocaleString()} words · {parsedDoc.pageCount} {parsedDoc.pageCount === 1 ? 'page' : 'pages'} · {parsedDoc.sections.length} sections
                  </span>
                  <button
                    onClick={() => setPreviewExpanded(v => !v)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {previewExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>
              <div
                className="px-4 py-3 overflow-y-auto transition-all duration-300"
                style={{ maxHeight: previewExpanded ? '320px' : '100px' }}
              >
                <pre className="text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap font-sans">
                  {previewExpanded ? parsedDoc.raw.slice(0, 4000) : parsedDoc.preview}
                  {!previewExpanded && parsedDoc.raw.length > 800 && (
                    <span className="text-zinc-700"> …</span>
                  )}
                </pre>
              </div>
            </div>
          )}

          {parseError && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-900/50 bg-amber-950/20 text-amber-500 text-xs">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{parseError} File uploaded but text could not be extracted.</span>
            </div>
          )}

          {/* Event Name */}
          <div>
            <Label>Event Name</Label>
            <TextInput
              value={eventName}
              onChange={setEventName}
              placeholder="e.g. NYC Founders Summit 2026"
            />
          </div>

          {/* Event Type + City */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Event Type"
              value={eventType}
              onChange={setEventType}
              options={EVENT_TYPES}
              placeholder="Select event type..."
            />
            <Select
              label="City"
              value={city}
              onChange={setCity}
              options={CITIES}
              placeholder="Select city..."
            />
          </div>

          {/* Sponsor Goals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Sponsor Goals</Label>
              <span className="text-[11px] text-zinc-600">{sponsorGoals.length}/400</span>
            </div>
            <textarea
              value={sponsorGoals}
              onChange={(e) => setSponsorGoals(e.target.value.slice(0, 400))}
              placeholder="e.g. Raise $50k in sponsorships, attract fintech and Web3 brands, get 3 title sponsors at $15k each…"
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className={`w-full py-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
              canGenerate && !loading
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-[0_1px_20px_rgba(255,255,255,0.08)]'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
            }`}
          >
            {loading ? 'Generating sponsor leads…' : 'Generate Sponsor Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
