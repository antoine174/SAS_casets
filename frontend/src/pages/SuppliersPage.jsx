import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState({ type: null, item: null });
  const [name, setName]           = useState('');
  const [saving, setSaving]       = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await getSuppliers();
      setSuppliers(res.data.data || []);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setName(''); setModal({ type: 'create', item: null }); };
  const openEdit   = (s)  => { setName(s.name); setModal({ type: 'edit', item: s }); };
  const closeModal = ()   => setModal({ type: null, item: null });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (modal.type === 'create') {
        await createSupplier({ name });
        toast.success('Supplier created');
      } else {
        await updateSupplier(modal.item._id, { name });
        toast.success('Supplier updated');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await deleteSupplier(s._id);
      toast.success('Supplier deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage supply partners and drill into vehicle models</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M12 4v16m8-8H4" />
          </svg>
          New Supplier
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <svg className="w-12 h-12 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeWidth={1} d="M3 21V7l9-4 9 4v14M9 21V11h6v10" />
          </svg>
          <p className="text-sm font-medium">No suppliers yet</p>
          <p className="text-xs mt-1">Create your first supplier to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {suppliers.map((s) => (
            <div
              key={s._id}
              className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-150 group cursor-pointer"
              onClick={() => navigate(`/suppliers/${s._id}/cars`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-slate-900 flex items-center justify-center mb-3 shrink-0">
                    <span className="text-white font-bold text-sm">{s.name.charAt(0).toUpperCase()}</span>
                  </div>
                  {/* Actions — stop propagation to prevent card navigation */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="square" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="square" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{s.name}</p>
                <p className="text-xs text-slate-400 mt-1">Click to view vehicles →</p>
              </div>
              <div className="h-0.5 w-0 group-hover:w-full bg-blue-600 transition-all duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={!!modal.type} onClose={closeModal} title={modal.type === 'create' ? 'New Supplier' : 'Edit Supplier'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Supplier Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Toyota Motor Corp"
              className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Spinner size="sm" />}
              {modal.type === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
