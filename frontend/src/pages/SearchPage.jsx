import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { searchParts } from '../services/api';
import Spinner from '../components/ui/Spinner';

export default function SearchPage() {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchParts(query.trim());
      setResults(res.data.data || []);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Global Part Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search across all suppliers and vehicles by Part No. or Part Name</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-0 mb-8 max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter part number or name..."
          className="flex-1 px-4 py-3 text-sm border border-slate-300 border-r-0 bg-white focus:border-blue-500 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? <Spinner size="sm" /> : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          )}
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm font-medium">No results found for "{query}"</p>
          <p className="text-xs mt-1">Try searching by a different term</p>
        </div>
      ) : results.length > 0 ? (
        <div className="bg-white border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-left">
                {['Part No.', 'Part Name', 'Supplier', 'Vehicle', 'Material Type', 'Unit Price', 'Navigate'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((p, idx) => (
                <tr key={p._id} className={`border-t border-slate-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{p.partNo}</td>
                  <td className="px-4 py-3 text-slate-700">{p.partName || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.supplierId?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.carId?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.materialType || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {p.unitPrice != null ? `$${Number(p.unitPrice).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.supplierId?._id && p.carId?._id && (
                      <Link
                        to={`/suppliers/${p.supplierId._id}/cars/${p.carId._id}/parts`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
