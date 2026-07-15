import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSuppliers, getCars, analyzeBulkImport, commitBulkImport } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { useEffect } from 'react';

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count, variant }) {
  const colors = {
    green: 'border-l-emerald-500 bg-emerald-50',
    blue:  'border-l-blue-500 bg-blue-50',
    red:   'border-l-red-500 bg-red-50',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-l-4 ${colors[variant]} mb-0`}>
      <span className="text-lg">{icon}</span>
      <span className="font-semibold text-slate-800 text-sm">{title}</span>
      <Badge variant={variant === 'green' ? 'green' : variant === 'blue' ? 'blue' : 'red'}>{count}</Badge>
    </div>
  );
}

// ─── Conflict Row ─────────────────────────────────────────────────────────────
function ConflictRow({ conflict, resolution, onChange }) {
  return (
    <tr className="border-t border-red-100 bg-white hover:bg-red-50/30 transition-colors">
      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{conflict.partNo}</td>
      <td className="px-4 py-3 text-slate-600 text-xs">{conflict.partName || '—'}</td>
      <td className="px-4 py-3">
        <span className="text-slate-400 line-through text-xs">${Number(conflict.oldPrice).toFixed(2)}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-red-600 font-semibold text-xs">${Number(conflict.newPrice).toFixed(2)}</span>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Custom…"
          value={resolution?.customPrice ?? ''}
          onChange={(e) => onChange({ ...resolution, customPrice: e.target.value, choice: 'custom' })}
          className="w-28 px-2 py-1 text-xs border border-slate-300 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          {[
            { value: 'keep',   label: `Keep Old  $${Number(conflict.oldPrice).toFixed(2)}` },
            { value: 'use',    label: `Use New  $${Number(conflict.newPrice).toFixed(2)}` },
            { value: 'custom', label: 'Use Custom Price' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`conflict-${conflict._id}`}
                value={value}
                checked={resolution?.choice === value}
                onChange={() => onChange({ ...resolution, choice: value })}
                className="accent-blue-600"
              />
              <span className={`text-xs ${resolution?.choice === value ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{label}</span>
            </label>
          ))}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Import Page ─────────────────────────────────────────────────────────
export default function ImportPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [cars, setCars]           = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [carId, setCarId]           = useState('');
  const [loadingCars, setLoadingCars] = useState(false);

  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'text'

  // File-tab state
  const [dragOver, setDragOver]   = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // raw File object
  const [fileName, setFileName]   = useState('');
  const fileRef = useRef();

  // Text-tab state
  const [pasteText, setPasteText] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [result, setResult] = useState(null); // { matched, conflicts, new }
  const [resolutions, setResolutions] = useState({}); // { [conflictId]: { choice, customPrice } }

  // Load suppliers on mount
  useEffect(() => {
    getSuppliers()
      .then((r) => setSuppliers(r.data.data || []))
      .catch(() => toast.error('Failed to load suppliers'));
  }, []);

  // Load cars when supplier changes
  useEffect(() => {
    if (!supplierId) { setCars([]); setCarId(''); return; }
    setLoadingCars(true);
    getCars(supplierId)
      .then((r) => { setCars(r.data.data || []); setCarId(''); })
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setLoadingCars(false));
  }, [supplierId]);

  // ─── File Handling ──────────────────────────────────────────────────────────
  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json')) { toast.error('Please upload a .json file'); return; }
    setSelectedFile(file);
    setFileName(file.name);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, []);

  // ─── Analyze (branches on activeTab) ────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!supplierId) { toast.error('Select a supplier first'); return; }
    if (!carId)      { toast.error('Select a vehicle first');  return; }

    // Parse items from whichever input is active
    const parseItems = () =>
      new Promise((resolve, reject) => {
        if (activeTab === 'text') {
          if (!pasteText.trim()) { reject(new Error('__EMPTY_TEXT')); return; }
          try {
            const parsed = JSON.parse(pasteText);
            if (!Array.isArray(parsed)) throw new Error('Root must be an array');
            resolve(parsed);
          } catch (err) {
            reject(new Error('__TEXT_PARSE'));
          }
        } else {
          if (!selectedFile) { reject(new Error('__NO_FILE')); return; }
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const parsed = JSON.parse(e.target.result);
              if (!Array.isArray(parsed)) throw new Error('Root must be an array');
              resolve(parsed);
            } catch {
              reject(new Error('__FILE_PARSE'));
            }
          };
          reader.onerror = () => reject(new Error('__FILE_READ'));
          reader.readAsText(selectedFile);
        }
      });

    let items;
    try {
      items = await parseItems();
    } catch (err) {
      const msg = err.message;
      if (msg === '__EMPTY_TEXT')  toast.error('The text area is empty. Paste a JSON array first.');
      else if (msg === '__TEXT_PARSE') toast.error('Invalid JSON format in text area. Please check syntax.');
      else if (msg === '__NO_FILE')    toast.error('No file selected. Drop or browse a .json file.');
      else if (msg === '__FILE_PARSE') toast.error('The uploaded file contains invalid JSON.');
      else                             toast.error('Could not read file.');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setResolutions({});
    try {
      const res = await analyzeBulkImport({ supplierId, carId, items });
      const data = res.data.data;
      setResult(data);
      // Pre-init resolutions for conflicts (no choice selected yet)
      const init = {};
      data.conflicts.forEach((c) => { init[c._id] = { choice: null, customPrice: '' }; });
      setResolutions(init);
      toast.success(`Analysis complete — ${data.matched.length} matched, ${data.conflicts.length} conflicts, ${data.new.length} new`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Commit ─────────────────────────────────────────────────────────────────
  const allConflictsResolved =
    result?.conflicts.every((c) => {
      const r = resolutions[c._id];
      if (!r || !r.choice) return false;
      if (r.choice === 'custom' && !r.customPrice) return false;
      return true;
    }) ?? false;

  const handleCommit = async () => {
    if (!allConflictsResolved) return;

    // Build updates array from resolved conflicts
    const updates = result.conflicts
      .filter((c) => resolutions[c._id]?.choice !== 'keep')
      .map((c) => {
        const r = resolutions[c._id];
        const finalPrice =
          r.choice === 'use'    ? c.newPrice :
          r.choice === 'custom' ? Number(r.customPrice) : c.oldPrice;
        return { _id: c._id, unitPrice: finalPrice };
      });

    setCommitting(true);
    try {
      const res = await commitBulkImport({
        supplierId, carId,
        updates,
        inserts: result.new,
      });
      const { nModified, nInserted } = res.data.data;
      toast.success(`Import committed — ${nInserted} inserted, ${nModified} updated`);
      setResult(null);
      setResolutions({});
      setPasteText('');
      setSelectedFile(null);
      setFileName('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Commit failed');
    } finally {
      setCommitting(false);
    }
  };

  const hasConflicts   = (result?.conflicts?.length ?? 0) > 0;
  const canCommit      = !!result && (!hasConflicts || allConflictsResolved);
  const hasInput       = activeTab === 'text' ? !!pasteText.trim() : !!selectedFile;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">JSON Import Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload a parts JSON file and resolve conflicts before committing to the database</p>
      </div>

      {/* ── Step 1: Supplier + Car ── */}
      <div className="bg-white border border-slate-200 p-6 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Step 1 — Select Target</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 outline-none transition-colors appearance-none"
            >
              <option value="">— Select Supplier —</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Vehicle</label>
            <div className="relative">
              <select
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                disabled={!supplierId || loadingCars}
                className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 outline-none transition-colors appearance-none disabled:opacity-50"
              >
                <option value="">— Select Vehicle —</option>
                {cars.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {loadingCars && <div className="absolute right-3 top-2.5"><Spinner size="sm" /></div>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 2: Tabbed JSON Input ── */}
      <div className="bg-white border border-slate-200 mb-4">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-200">
          <div className="px-6 py-4 shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Step 2 — Provide JSON</p>
          </div>
          <div className="flex ml-auto border-l border-slate-200">
            {[
              { id: 'file', label: 'Upload File', icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v13M8 9l4-4 4 4" />
                </svg>
              )},
              { id: 'text', label: 'Paste JSON', icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )},
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 border-b-2 ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'file' ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed cursor-pointer text-center py-10 px-6 transition-colors duration-150 ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <svg className="w-10 h-10 mx-auto mb-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="square" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v13M8 9l4-4 4 4" />
                </svg>
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M9 12l2 2 4-4M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z" />
                    </svg>
                    <p className="text-sm font-medium text-blue-600">{fileName}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">Drag & drop a JSON file here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse — format: <code className="bg-slate-100 px-1">{"[{partNo, partName, unitPrice}]"}</code></p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => processFile(e.target.files[0])} />
            </>
          ) : (
            /* Paste Textarea */
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Paste your JSON array here... [{"partNo": "123", "partName": "Gear", "unitPrice": 5.00}]'}
              className="w-full h-64 p-4 border border-slate-300 rounded-sm font-mono text-sm focus:outline-none focus:border-blue-600 resize-none bg-slate-50"
              spellCheck={false}
            />
          )}

          {/* Analyze Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !hasInput || !supplierId || !carId}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium disabled:opacity-40 transition-colors"
            >
              {analyzing ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M9 5l7 7-7 7" />
                </svg>
              )}
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Step 3: Results ── */}
      {result && (
        <div className="space-y-4">
          {/* ── Matched ── */}
          {result.matched.length > 0 && (
            <div className="bg-white border border-slate-200">
              <SectionHeader icon="✅" title="Matched — Price Identical" count={result.matched.length} variant="green" />
              <table className="w-full text-xs">
                <thead><tr className="bg-emerald-800 text-white">
                  {['Part No.', 'Part Name', 'Price'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {result.matched.map((p) => (
                    <tr key={p.partNo} className="border-t border-emerald-100 hover:bg-emerald-50/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-700">{p.partNo}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.partName || '—'}</td>
                      <td className="px-4 py-2.5 font-semibold text-emerald-700">${Number(p.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── New Parts ── */}
          {result.new.length > 0 && (
            <div className="bg-white border border-slate-200">
              <SectionHeader icon="🆕" title="New — Will Be Inserted" count={result.new.length} variant="blue" />
              <table className="w-full text-xs">
                <thead><tr className="bg-blue-800 text-white">
                  {['Part No.', 'Part Name', 'Price'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {result.new.map((p) => (
                    <tr key={p.partNo} className="border-t border-blue-100 hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-700">{p.partNo}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.partName || '—'}</td>
                      <td className="px-4 py-2.5 font-semibold text-blue-700">${Number(p.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Conflicts ── */}
          {result.conflicts.length > 0 && (
            <div className="bg-white border border-red-200">
              <SectionHeader icon="⚠️" title="Conflicts — Price Mismatch (Action Required)" count={result.conflicts.length} variant="red" />
              <p className="text-xs text-red-600 px-4 py-2 bg-red-50 border-b border-red-100">
                Select a resolution for every conflict before the Commit button becomes active.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-red-800 text-white">
                    {['Part No.', 'Part Name', 'Old Price', 'New Price', 'Custom Price', 'Resolution'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {result.conflicts.map((c) => (
                      <ConflictRow
                        key={c._id}
                        conflict={c}
                        resolution={resolutions[c._id]}
                        onChange={(val) => setResolutions((prev) => ({ ...prev, [c._id]: val }))}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Commit ── */}
          <div className="flex items-center justify-between bg-white border border-slate-200 px-6 py-4">
            <div>
              {hasConflicts && !allConflictsResolved ? (
                <p className="text-sm text-amber-700 font-medium">⚠ Resolve all {result.conflicts.length} conflict{result.conflicts.length !== 1 ? 's' : ''} to enable commit</p>
              ) : (
                <p className="text-sm text-emerald-700 font-medium">✓ All conflicts resolved — ready to commit</p>
              )}
            </div>
            <button
              onClick={handleCommit}
              disabled={committing || !canCommit}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {committing ? <Spinner size="sm" /> : null}
              {committing ? 'Committing…' : 'Commit Import'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
