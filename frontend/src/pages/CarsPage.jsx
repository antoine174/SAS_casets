import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCars, createCar, updateCar, deleteCar } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

export default function CarsPage() {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  const [cars, setCars]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState({ type: null, item: null });
  const [name, setName]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [supplierName, setSupplierName] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCars(supplierId);
      const data = res.data.data || [];
      setCars(data);
      if (data.length > 0) setSupplierName(data[0].supplierId?.name || '');
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [supplierId]);

  const openCreate = () => { setName(''); setModal({ type: 'create', item: null }); };
  const openEdit   = (c)  => { setName(c.name); setModal({ type: 'edit', item: c }); };
  const closeModal = ()   => setModal({ type: null, item: null });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (modal.type === 'create') {
        await createCar({ name, supplierId });
        toast.success('Vehicle added');
      } else {
        await updateCar(modal.item._id, { name });
        toast.success('Vehicle updated');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await deleteCar(c._id);
      toast.success('Vehicle deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link to="/suppliers" className="hover:text-blue-600 transition-colors">Suppliers</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{supplierName || '...'}</span>
        <span>/</span>
        <span className="text-slate-700 font-medium">Vehicles</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Vehicles</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a vehicle to view its parts catalogue</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <svg className="w-12 h-12 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeWidth={1} d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h2m14 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2M7 17h10M5 9l2-5h10l2 5" />
          </svg>
          <p className="text-sm font-medium">No vehicles yet</p>
          <p className="text-xs mt-1">Add the first vehicle model for this supplier</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cars.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-150 group cursor-pointer"
              onClick={() => navigate(`/suppliers/${supplierId}/cars/${c._id}/parts`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 shrink-0">
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="square" d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h2m14 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2M7 17h10M5 9l2-5h10l2 5" />
                    </svg>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="square" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="square" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{c.name}</p>
                <p className="text-xs text-slate-400 mt-1">View parts catalogue →</p>
              </div>
              <div className="h-0.5 w-0 group-hover:w-full bg-blue-600 transition-all duration-300" />
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modal.type} onClose={closeModal} title={modal.type === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Vehicle Name / Model</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Corolla 2024"
              className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Spinner size="sm" />}
              {modal.type === 'create' ? 'Add' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
